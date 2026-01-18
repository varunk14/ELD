"""
Routing service using OpenRouteService API.

OpenRouteService provides:
- Route calculation with driving times
- Support for truck profiles
- Polyline encoding for route display

API Key required - get free key at https://openrouteservice.org/
Free tier: 2,000 requests/day

Currently using MOCK DATA for development.
TODO: Set USE_MOCK_DATA = False when ready to use real APIs.
"""
import logging
import requests
from typing import Optional
from django.conf import settings

from .mock_data import mock_route, mock_trip_route

logger = logging.getLogger(__name__)

# Toggle for using mock data vs real API
USE_MOCK_DATA = False  # Using real OpenRouteService API

ORS_BASE_URL = "https://api.openrouteservice.org/v2"


class RoutingService:
    """Service for calculating routes using OpenRouteService API."""

    def __init__(self):
        self.api_key = getattr(settings, 'ORS_API_KEY', '')
        self.base_url = ORS_BASE_URL

    def _get_headers(self) -> dict:
        """Get request headers with API key."""
        return {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def calculate_route(
        self,
        coordinates: list[tuple[float, float]],
        profile: str = "driving-car"
    ) -> Optional[dict]:
        """
        Calculate route between multiple points.

        Args:
            coordinates: List of (lng, lat) tuples - NOTE: ORS uses lng,lat order!
            profile: Vehicle profile ('driving-car', 'driving-hgv' for trucks)

        Returns:
            dict with route info including:
            - distance_meters: Total distance in meters
            - duration_seconds: Total duration in seconds
            - geometry: Polyline coordinates for map display
        """
        # Use mock data for development
        if USE_MOCK_DATA:
            return mock_route(coordinates)

        if not self.api_key:
            logger.error("ORS_API_KEY not configured")
            return None

        if len(coordinates) < 2:
            logger.error("At least 2 coordinates required for routing")
            return None

        try:
            response = requests.post(
                f"{self.base_url}/directions/{profile}",
                json={
                    "coordinates": coordinates,
                    "instructions": False,
                    "geometry": True,
                },
                headers=self._get_headers(),
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if "routes" in data and len(data["routes"]) > 0:
                route = data["routes"][0]
                summary = route.get("summary", {})

                # Decode geometry (GeoJSON format from ORS)
                geometry = route.get("geometry", {})
                coordinates_list = []

                if isinstance(geometry, dict) and geometry.get("type") == "LineString":
                    # GeoJSON LineString - coordinates are [lng, lat]
                    coordinates_list = [
                        [coord[1], coord[0]]  # Convert to [lat, lng] for Leaflet
                        for coord in geometry.get("coordinates", [])
                    ]
                elif isinstance(geometry, str):
                    # Encoded polyline - need to decode
                    coordinates_list = self._decode_polyline(geometry)

                return {
                    "distance_meters": summary.get("distance", 0),
                    "duration_seconds": summary.get("duration", 0),
                    "distance_miles": summary.get("distance", 0) / 1609.34,
                    "duration_hours": summary.get("duration", 0) / 3600,
                    "geometry": coordinates_list,
                }

            logger.error(f"No routes found in ORS response: {data}")
            return None

        except requests.RequestException as e:
            logger.error(f"Routing error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return None

    def calculate_trip_route(
        self,
        current_location: dict,
        pickup_location: dict,
        dropoff_location: dict,
    ) -> Optional[dict]:
        """
        Calculate a complete trip route: current -> pickup -> dropoff.

        Args:
            current_location: dict with 'lat' and 'lng'
            pickup_location: dict with 'lat' and 'lng'
            dropoff_location: dict with 'lat' and 'lng'

        Returns:
            dict with complete route information
        """
        # Use mock data for development
        if USE_MOCK_DATA:
            return mock_trip_route(current_location, pickup_location, dropoff_location)

        # Build coordinates list (ORS uses lng, lat order!)
        coordinates = [
            [current_location["lng"], current_location["lat"]],
            [pickup_location["lng"], pickup_location["lat"]],
            [dropoff_location["lng"], dropoff_location["lat"]],
        ]

        # Use driving-hgv (heavy goods vehicle) for truck routing
        route = self.calculate_route(coordinates, profile="driving-hgv")

        if route:
            # Add segment information
            route["segments"] = [
                {"from": "current", "to": "pickup"},
                {"from": "pickup", "to": "dropoff"},
            ]
            route["waypoints"] = {
                "current": current_location,
                "pickup": pickup_location,
                "dropoff": dropoff_location,
            }

        return route

    def _decode_polyline(self, encoded: str, precision: int = 5) -> list:
        """
        Decode an encoded polyline string to coordinates.

        Args:
            encoded: Encoded polyline string
            precision: Coordinate precision (5 for Google, 6 for ORS)

        Returns:
            List of [lat, lng] coordinates
        """
        coordinates = []
        index = 0
        lat = 0
        lng = 0
        factor = 10 ** precision

        while index < len(encoded):
            # Decode latitude
            shift = 0
            result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            lat += (~(result >> 1) if result & 1 else (result >> 1))

            # Decode longitude
            shift = 0
            result = 0
            while True:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            lng += (~(result >> 1) if result & 1 else (result >> 1))

            coordinates.append([lat / factor, lng / factor])

        return coordinates


# Singleton instance
routing_service = RoutingService()
