"""
Geocoding service using Nominatim (OpenStreetMap) API.

Nominatim is free but requires:
- User-Agent header
- Max 1 request per second (we handle this with rate limiting)

Currently using MOCK DATA for development.
TODO: Set USE_MOCK_DATA = False when ready to use real APIs.
"""
import logging
import time
import requests
from typing import Optional
from functools import lru_cache

from .mock_data import mock_geocode, mock_search

logger = logging.getLogger(__name__)

# Toggle for using mock data vs real API
USE_MOCK_DATA = True  # TODO: Set to False for production

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
    """Service for geocoding addresses using Nominatim API."""

    def __init__(self):
        self.base_url = NOMINATIM_BASE_URL
        self.headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        }

    def geocode(self, address: str) -> Optional[dict]:
        """
        Convert an address string to coordinates.

        Args:
            address: The address to geocode (e.g., "Chicago, IL")

        Returns:
            dict with lat, lng, display_name or None if not found
        """
        # Use mock data for development
        if USE_MOCK_DATA:
            return mock_geocode(address)

        _rate_limit()

        try:
            response = requests.get(
                f"{self.base_url}/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "us",  # Limit to US for trucking routes
                },
                headers=self.headers,
                timeout=10,
            )
            response.raise_for_status()
            results = response.json()

            if results:
                result = results[0]
                return {
                    "lat": float(result["lat"]),
                    "lng": float(result["lon"]),
                    "display_name": result["display_name"],
                }
            return None

        except requests.RequestException as e:
            logger.error(f"Geocoding error for '{address}': {e}")
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
        # Use mock data for development
        if USE_MOCK_DATA:
            return mock_search(query, limit)

        _rate_limit()

        try:
            response = requests.get(
                f"{self.base_url}/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": limit,
                    "countrycodes": "us",
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
            logger.error(f"Search error for '{query}': {e}")
            return []

    def reverse_geocode(self, lat: float, lng: float) -> Optional[dict]:
        """
        Convert coordinates to an address.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            dict with display_name or None if not found
        """
        _rate_limit()

        try:
            response = requests.get(
                f"{self.base_url}/reverse",
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
            logger.error(f"Reverse geocoding error for ({lat}, {lng}): {e}")
            return None


# Singleton instance
geocoding_service = GeocodingService()
