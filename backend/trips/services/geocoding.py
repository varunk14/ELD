"""
Geocoding service using multiple providers with fallback:
1. Photon (Komoot) - Fast, no strict rate limits
2. Nominatim (OpenStreetMap) - Fallback option

Both are free and based on OpenStreetMap data.
"""
import logging
import time
import requests
from typing import Optional
from functools import lru_cache

from .mock_data import mock_geocode, mock_search

logger = logging.getLogger(__name__)

# Toggle for using mock data vs real API
USE_MOCK_DATA = False  # Using real geocoding APIs

# API endpoints
PHOTON_BASE_URL = "https://photon.komoot.io"
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = "ELDTripPlanner/1.0 (contact@example.com)"

# Rate limiting - track last request time
_last_request_time = 0


def _rate_limit():
    """Ensure we don't exceed 1 request per second for Nominatim."""
    global _last_request_time
    current_time = time.time()
    time_since_last = current_time - _last_request_time
    if time_since_last < 1.0:
        time.sleep(1.0 - time_since_last)
    _last_request_time = time.time()


class GeocodingService:
    """Service for geocoding addresses using Photon (primary) and Nominatim (fallback)."""

    def __init__(self):
        self.headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        }

    def _search_photon(self, query: str, limit: int = 5) -> list:
        """Search using Photon API (Komoot)."""
        try:
            logger.info(f"Searching Photon API for: {query}")
            response = requests.get(
                f"{PHOTON_BASE_URL}/api",
                params={
                    "q": query,
                    "limit": limit,
                    "lang": "en",
                },
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Photon returned {len(data.get('features', []))} results")

            results = []
            for feature in data.get("features", []):
                props = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [])

                if len(coords) >= 2:
                    # Build display name
                    parts = []
                    if props.get("name"):
                        parts.append(props["name"])
                    if props.get("city"):
                        parts.append(props["city"])
                    if props.get("state"):
                        parts.append(props["state"])
                    if props.get("country"):
                        parts.append(props["country"])

                    display_name = ", ".join(parts) if parts else props.get("name", "Unknown")

                    results.append({
                        "lat": float(coords[1]),  # Photon returns [lng, lat]
                        "lng": float(coords[0]),
                        "display_name": display_name,
                        "place_id": props.get("osm_id", 0),
                    })

                    if len(results) >= limit:
                        break

            logger.info(f"Photon returned {len(results)} results for '{query}'")
            return results

        except requests.RequestException as e:
            logger.warning(f"Photon search error for '{query}': {e}")
            return []

    def _search_nominatim(self, query: str, limit: int = 5) -> list:
        """Search using Nominatim API (fallback)."""
        _rate_limit()

        try:
            response = requests.get(
                f"{NOMINATIM_BASE_URL}/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": limit,
                    "addressdetails": 1,
                },
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            results = response.json()

            return [
                {
                    "lat": float(r["lat"]),
                    "lng": float(r["lon"]),
                    "display_name": r["display_name"],
                    "place_id": r["place_id"],
                }
                for r in results
            ]

        except requests.RequestException as e:
            logger.warning(f"Nominatim search error for '{query}': {e}")
            return []

    def geocode(self, address: str) -> Optional[dict]:
        """
        Convert an address string to coordinates.

        Args:
            address: The address to geocode (e.g., "Chicago, IL")

        Returns:
            dict with lat, lng, display_name or None if not found
        """
        if USE_MOCK_DATA:
            return mock_geocode(address)

        # Try Photon first, then Nominatim
        results = self._search_photon(address, limit=1)
        if not results:
            results = self._search_nominatim(address, limit=1)

        if results:
            return results[0]
        return None

    def search(self, query: str, limit: int = 5) -> list:
        """
        Search for addresses matching a query (for autocomplete).

        Args:
            query: The search query
            limit: Maximum number of results

        Returns:
            List of matching addresses with coordinates
        """
        if USE_MOCK_DATA:
            return mock_search(query, limit)

        # Try Photon first, then Nominatim as fallback
        results = self._search_photon(query, limit)
        if not results:
            logger.info("Photon returned no results, trying Nominatim")
            results = self._search_nominatim(query, limit)

        return results

    def _reverse_photon(self, lat: float, lng: float) -> Optional[dict]:
        """Reverse geocode using Photon API."""
        try:
            response = requests.get(
                f"{PHOTON_BASE_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "lang": "en",
                },
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            features = data.get("features", [])
            if features:
                props = features[0].get("properties", {})
                coords = features[0].get("geometry", {}).get("coordinates", [])

                parts = []
                if props.get("name"):
                    parts.append(props["name"])
                if props.get("city"):
                    parts.append(props["city"])
                if props.get("state"):
                    parts.append(props["state"])

                return {
                    "lat": float(coords[1]) if len(coords) >= 2 else lat,
                    "lng": float(coords[0]) if len(coords) >= 2 else lng,
                    "display_name": ", ".join(parts) if parts else "Unknown",
                }
            return None

        except requests.RequestException as e:
            logger.warning(f"Photon reverse error for ({lat}, {lng}): {e}")
            return None

    def _reverse_nominatim(self, lat: float, lng: float) -> Optional[dict]:
        """Reverse geocode using Nominatim API."""
        _rate_limit()

        try:
            response = requests.get(
                f"{NOMINATIM_BASE_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                },
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            result = response.json()

            if result and "display_name" in result:
                return {
                    "lat": float(result["lat"]),
                    "lng": float(result["lon"]),
                    "display_name": result["display_name"],
                }
            return None

        except requests.RequestException as e:
            logger.warning(f"Nominatim reverse error for ({lat}, {lng}): {e}")
            return None

    def reverse_geocode(self, lat: float, lng: float) -> Optional[dict]:
        """
        Convert coordinates to an address.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            dict with display_name or None if not found
        """
        # Try Photon first, then Nominatim
        result = self._reverse_photon(lat, lng)
        if not result:
            result = self._reverse_nominatim(lat, lng)

        return result


# Singleton instance
geocoding_service = GeocodingService()
