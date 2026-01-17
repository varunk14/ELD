import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListAPIView, RetrieveAPIView, DestroyAPIView

from .models import Trip
from .serializers import (
    TripCalculateSerializer,
    TripCalculateResponseSerializer,
    TripSerializer,
    TripListSerializer,
    GeocodeSuggestSerializer,
)
from .services.geocoding import geocoding_service
from .services.routing import routing_service
from .services.hos_calculator import hos_calculator

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

        # Calculate HOS-compliant schedule
        hos_schedule = hos_calculator.calculate_trip_schedule(
            total_drive_time=route['duration_hours'],
            current_cycle_hours=float(data['current_cycle_hours']),
            total_distance_miles=route['distance_miles'],
            current_location=current_geo,
            pickup_location=pickup_geo,
            dropoff_location=dropoff_geo,
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
            # HOS schedule data
            "schedule": hos_schedule['daily_schedules'],
            "stops": hos_schedule['stops'],
            "hos_summary": hos_schedule['summary'],
        }

        # Save trip to database
        trip = Trip.objects.create(
            user=request.user,
            current_location=data['current_location'],
            current_location_lat=current_geo['lat'],
            current_location_lng=current_geo['lng'],
            pickup_location=data['pickup_location'],
            pickup_location_lat=pickup_geo['lat'],
            pickup_location_lng=pickup_geo['lng'],
            dropoff_location=data['dropoff_location'],
            dropoff_location_lat=dropoff_geo['lat'],
            dropoff_location_lng=dropoff_geo['lng'],
            current_cycle_hours=data['current_cycle_hours'],
            total_distance_miles=route['distance_miles'],
            total_driving_hours=route['duration_hours'],
            route_polyline=route['geometry'],
            schedule=hos_schedule['daily_schedules'],
            stops=hos_schedule['stops'],
            hos_summary=hos_schedule['summary'],
        )

        # Add trip ID to response
        response_data['id'] = str(trip.id)

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


class TripListView(ListAPIView):
    """
    List all trips for the authenticated user.

    GET /api/trips/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TripListSerializer

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).order_by('-created_at')


class TripDetailView(RetrieveAPIView):
    """
    Get a single trip by ID.

    GET /api/trips/<id>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TripSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)


class TripDeleteView(DestroyAPIView):
    """
    Delete a trip by ID.

    DELETE /api/trips/<id>/
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Trip deleted successfully"},
            status=status.HTTP_200_OK
        )
