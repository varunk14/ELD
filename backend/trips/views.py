import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import (
    TripCalculateSerializer,
    TripCalculateResponseSerializer,
    GeocodeSuggestSerializer,
)
from .services.geocoding import geocoding_service
from .services.routing import routing_service

logger = logging.getLogger(__name__)


class TripCalculateView(APIView):
    """
    Calculate a trip route with geocoding and routing.

    POST /api/trips/calculate/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TripCalculateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # Geocode all locations
        current_geo = geocoding_service.geocode(data['current_location'])
        if not current_geo:
            return Response(
                {"error": f"Could not geocode current location: {data['current_location']}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        pickup_geo = geocoding_service.geocode(data['pickup_location'])
        if not pickup_geo:
            return Response(
                {"error": f"Could not geocode pickup location: {data['pickup_location']}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        dropoff_geo = geocoding_service.geocode(data['dropoff_location'])
        if not dropoff_geo:
            return Response(
                {"error": f"Could not geocode dropoff location: {data['dropoff_location']}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate route
        route = routing_service.calculate_trip_route(
            current_location=current_geo,
            pickup_location=pickup_geo,
            dropoff_location=dropoff_geo,
        )

        if not route:
            return Response(
                {"error": "Could not calculate route. Please check your locations and try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build response
        response_data = {
            "current_location": current_geo,
            "pickup_location": pickup_geo,
            "dropoff_location": dropoff_geo,
            "current_cycle_hours": float(data['current_cycle_hours']),
            "total_distance_miles": round(route['distance_miles'], 2),
            "total_driving_hours": round(route['duration_hours'], 2),
            "route_polyline": route['geometry'],
        }

        return Response({"data": response_data}, status=status.HTTP_200_OK)


class GeocodeSearchView(APIView):
    """
    Search for addresses (for autocomplete).

    GET /api/geocode/?address=Chicago
    """
    permission_classes = [AllowAny]  # Allow unauthenticated for autocomplete

    def get(self, request):
        address = request.query_params.get('address', '')

        if not address or len(address) < 2:
            return Response(
                {"results": []},
                status=status.HTTP_200_OK
            )

        results = geocoding_service.search(address, limit=5)

        serializer = GeocodeSuggestSerializer(results, many=True)
        return Response(
            {"results": serializer.data},
            status=status.HTTP_200_OK
        )
