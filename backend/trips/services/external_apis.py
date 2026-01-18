"""
External API Services for ELD Trip Planner

Integrates with:
- Nominatim (OpenStreetMap) - Geocoding/Address search
- OpenRouteService - Route calculation with truck routing
- Overpass API - Find truck stops and rest areas
"""

import requests
import time
from typing import Optional, List, Dict, Tuple
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# API Configuration
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
ORS_BASE_URL = "https://api.openrouteservice.org/v2"
OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter"

# Rate limiting for Nominatim (1 request per second)
_last_nominatim_request = 0


class NominatimService:
    """
    Geocoding service using OpenStreetMap's Nominatim API.
    Free, no API key required, but rate limited to 1 req/sec.
    """

    @staticmethod
    def _rate_limit():
        """Ensure we don't exceed 1 request per second."""
        global _last_nominatim_request
        now = time.time()
        elapsed = now - _last_nominatim_request
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        _last_nominatim_request = time.time()

    @staticmethod
    def search(query: str, limit: int = 5) -> List[Dict]:
        """
        Search for locations by address/name.

        Args:
            query: Search string (address, city, etc.)
            limit: Max results to return

        Returns:
            List of location dictionaries with lat, lng, display_name
        """
        NominatimService._rate_limit()

        try:
            response = requests.get(
                f"{NOMINATIM_BASE_URL}/search",
                params={
                    "q": query,
                    "format": "json",
                    "limit": limit,
                    "countrycodes": "us",  # Limit to USA
                    "addressdetails": 1,
                },
                headers={
                    "User-Agent": "ELDTripPlanner/1.0 (Educational Project)"
                },
                timeout=10
            )
            response.raise_for_status()

            results = []
            for item in response.json():
                results.append({
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"]),
                    "display_name": item["display_name"],
                    "place_id": item.get("place_id"),
                    "type": item.get("type"),
                    "address": item.get("address", {}),
                })

            return results

        except requests.RequestException as e:
            logger.error(f"Nominatim search error: {e}")
            return []

    @staticmethod
    def reverse(lat: float, lng: float) -> Optional[Dict]:
        """
        Reverse geocode coordinates to address.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            Location dictionary or None
        """
        NominatimService._rate_limit()

        try:
            response = requests.get(
                f"{NOMINATIM_BASE_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                    "addressdetails": 1,
                },
                headers={
                    "User-Agent": "ELDTripPlanner/1.0 (Educational Project)"
                },
                timeout=10
            )
            response.raise_for_status()

            item = response.json()
            return {
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
                "display_name": item["display_name"],
                "address": item.get("address", {}),
            }

        except requests.RequestException as e:
            logger.error(f"Nominatim reverse error: {e}")
            return None


class OpenRouteService:
    """
    Routing service using OpenRouteService API.
    Supports truck routing with vehicle parameters.
    """

    def __init__(self):
        self.api_key = getattr(settings, 'ORS_API_KEY', None)
        if not self.api_key or self.api_key == 'your-openrouteservice-api-key':
            logger.warning("ORS_API_KEY not configured")

    def get_route(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        waypoints: Optional[List[Tuple[float, float]]] = None,
        profile: str = "driving-hgv"  # Heavy goods vehicle (truck)
    ) -> Optional[Dict]:
        """
        Calculate route between points.

        Args:
            start: (lng, lat) tuple for start point
            end: (lng, lat) tuple for end point
            waypoints: Optional list of (lng, lat) tuples for intermediate stops
            profile: Routing profile (driving-hgv for trucks)

        Returns:
            Route dictionary with distance, duration, and geometry
        """
        if not self.api_key:
            logger.error("ORS API key not configured")
            return None

        # Build coordinates list [start, ...waypoints, end]
        coordinates = [list(start)]
        if waypoints:
            coordinates.extend([list(wp) for wp in waypoints])
        coordinates.append(list(end))

        try:
            response = requests.post(
                f"{ORS_BASE_URL}/directions/{profile}",
                json={
                    "coordinates": coordinates,
                    "instructions": False,
                    "geometry": True,
                    "units": "mi",  # Miles
                },
                headers={
                    "Authorization": self.api_key,
                    "Content-Type": "application/json",
                },
                timeout=30
            )
            response.raise_for_status()

            data = response.json()

            if "routes" not in data or len(data["routes"]) == 0:
                logger.error("No routes found in ORS response")
                return None

            route = data["routes"][0]
            summary = route.get("summary", {})

            # Decode polyline geometry
            geometry = route.get("geometry", "")
            coordinates = self._decode_polyline(geometry)

            return {
                "distance_miles": summary.get("distance", 0),
                "duration_hours": summary.get("duration", 0) / 3600,  # Convert seconds to hours
                "coordinates": coordinates,  # List of [lat, lng] pairs
                "raw_geometry": geometry,
            }

        except requests.RequestException as e:
            logger.error(f"ORS routing error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return None

    def _decode_polyline(self, encoded: str, precision: int = 5) -> List[List[float]]:
        """
        Decode a polyline string into a list of coordinates.
        OpenRouteService uses Google's polyline encoding.
        """
        coordinates = []
        index = 0
        lat = 0
        lng = 0

        while index < len(encoded):
            # Decode latitude
            shift = 0
            result = 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if b < 0x20:
                    break
            dlat = ~(result >> 1) if result & 1 else result >> 1
            lat += dlat

            # Decode longitude
            shift = 0
            result = 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if b < 0x20:
                    break
            dlng = ~(result >> 1) if result & 1 else result >> 1
            lng += dlng

            coordinates.append([lat / (10 ** precision), lng / (10 ** precision)])

        return coordinates


class OverpassService:
    """
    Find truck stops and rest areas using OpenStreetMap Overpass API.
    """

    @staticmethod
    def find_truck_stops_along_route(
        coordinates: List[List[float]],
        search_radius_meters: int = 5000,
        max_stops: int = 20
    ) -> List[Dict]:
        """
        Find truck stops and rest areas along a route.

        Args:
            coordinates: List of [lat, lng] points along the route
            search_radius_meters: Search radius around route points
            max_stops: Maximum number of stops to return

        Returns:
            List of truck stop dictionaries
        """
        # Sample points along route (every ~50 miles worth of points)
        sample_points = OverpassService._sample_route_points(coordinates, max_points=10)

        if not sample_points:
            return []

        # Build Overpass query for truck stops and rest areas
        # Query for: fuel stations, truck stops, rest areas
        bbox_queries = []
        for lat, lng in sample_points:
            # Create small bounding box around each point
            delta = search_radius_meters / 111000  # Rough conversion to degrees
            bbox_queries.append(f"""
                node["amenity"="fuel"](around:{search_radius_meters},{lat},{lng});
                node["amenity"="truck_stop"](around:{search_radius_meters},{lat},{lng});
                node["highway"="rest_area"](around:{search_radius_meters},{lat},{lng});
                node["highway"="services"](around:{search_radius_meters},{lat},{lng});
            """)

        query = f"""
        [out:json][timeout:25];
        (
            {"".join(bbox_queries)}
        );
        out body;
        """

        try:
            response = requests.post(
                OVERPASS_BASE_URL,
                data={"data": query},
                timeout=30
            )
            response.raise_for_status()

            data = response.json()
            elements = data.get("elements", [])

            # Process results
            stops = []
            seen_coords = set()  # Avoid duplicates

            for element in elements:
                lat = element.get("lat")
                lng = element.get("lon")

                if not lat or not lng:
                    continue

                # Skip duplicates (within 0.01 degrees)
                coord_key = (round(lat, 2), round(lng, 2))
                if coord_key in seen_coords:
                    continue
                seen_coords.add(coord_key)

                tags = element.get("tags", {})

                # Determine stop type and name
                stop_type = "fuel"
                name = tags.get("name", "")

                if tags.get("amenity") == "truck_stop":
                    stop_type = "truck_stop"
                    name = name or "Truck Stop"
                elif tags.get("highway") == "rest_area":
                    stop_type = "rest_area"
                    name = name or "Rest Area"
                elif tags.get("highway") == "services":
                    stop_type = "service_area"
                    name = name or "Service Area"
                else:
                    # Fuel station - check if it's a major truck stop chain
                    brand = tags.get("brand", "").lower()
                    if any(chain in brand for chain in ["pilot", "flying j", "love", "ta ", "petro"]):
                        stop_type = "truck_stop"
                    name = name or tags.get("brand", "Fuel Station")

                stops.append({
                    "id": element.get("id"),
                    "lat": lat,
                    "lng": lng,
                    "name": name,
                    "type": stop_type,
                    "brand": tags.get("brand", ""),
                    "address": OverpassService._format_address(tags),
                    "amenities": {
                        "fuel": tags.get("fuel:diesel") == "yes" or tags.get("amenity") == "fuel",
                        "parking": tags.get("parking") is not None or stop_type in ["truck_stop", "rest_area"],
                        "food": tags.get("food") == "yes" or tags.get("amenity") == "restaurant",
                        "showers": tags.get("shower") == "yes",
                    }
                })

                if len(stops) >= max_stops:
                    break

            return stops

        except requests.RequestException as e:
            logger.error(f"Overpass API error: {e}")
            return []

    @staticmethod
    def _sample_route_points(coordinates: List[List[float]], max_points: int = 10) -> List[Tuple[float, float]]:
        """Sample evenly spaced points along a route."""
        if not coordinates:
            return []

        if len(coordinates) <= max_points:
            return [(c[0], c[1]) for c in coordinates]

        # Sample evenly
        step = len(coordinates) // max_points
        sampled = []
        for i in range(0, len(coordinates), step):
            sampled.append((coordinates[i][0], coordinates[i][1]))
            if len(sampled) >= max_points:
                break

        return sampled

    @staticmethod
    def _format_address(tags: Dict) -> str:
        """Format address from OSM tags."""
        parts = []
        if tags.get("addr:housenumber"):
            parts.append(tags["addr:housenumber"])
        if tags.get("addr:street"):
            parts.append(tags["addr:street"])
        if tags.get("addr:city"):
            parts.append(tags["addr:city"])
        if tags.get("addr:state"):
            parts.append(tags["addr:state"])

        return ", ".join(parts) if parts else ""


# Singleton instances
nominatim_service = NominatimService()
ors_service = OpenRouteService()
overpass_service = OverpassService()
