from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Trip


class TripCalculateSerializer(serializers.Serializer):
    """Serializer for trip calculation request."""

    current_location = serializers.CharField(
        max_length=500,
        required=True,
        help_text="Starting location address"
    )
    pickup_location = serializers.CharField(
        max_length=500,
        required=True,
        help_text="Pickup location address"
    )
    dropoff_location = serializers.CharField(
        max_length=500,
        required=True,
        help_text="Dropoff location address"
    )
    current_cycle_hours = serializers.DecimalField(
        max_digits=4,
        decimal_places=2,
        required=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(70)
        ],
        help_text="Current cycle hours used (0-70)"
    )


class LocationCoordinatesSerializer(serializers.Serializer):
    """Serializer for location with coordinates."""

    lat = serializers.FloatField()
    lng = serializers.FloatField()
    display_name = serializers.CharField()


class TripCalculateResponseSerializer(serializers.Serializer):
    """Serializer for trip calculation response."""

    current_location = LocationCoordinatesSerializer()
    pickup_location = LocationCoordinatesSerializer()
    dropoff_location = LocationCoordinatesSerializer()
    current_cycle_hours = serializers.DecimalField(max_digits=4, decimal_places=2)
    total_distance_miles = serializers.FloatField()
    total_driving_hours = serializers.FloatField()
    route_polyline = serializers.ListField(
        child=serializers.ListField(child=serializers.FloatField())
    )


class TripSerializer(serializers.ModelSerializer):
    """Full serializer for Trip model (detail view)."""

    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'current_location_lat',
            'current_location_lng',
            'pickup_location',
            'pickup_location_lat',
            'pickup_location_lng',
            'dropoff_location',
            'dropoff_location_lat',
            'dropoff_location_lng',
            'current_cycle_hours',
            'total_distance_miles',
            'total_driving_hours',
            'route_polyline',
            'schedule',
            'stops',
            'hos_summary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TripListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing trips."""

    total_days = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'total_distance_miles',
            'total_driving_hours',
            'total_days',
            'created_at',
        ]

    def get_total_days(self, obj):
        if obj.hos_summary and 'total_days' in obj.hos_summary:
            return obj.hos_summary['total_days']
        return len(obj.schedule) if obj.schedule else 1


class GeocodeSuggestSerializer(serializers.Serializer):
    """Serializer for geocode suggestion response."""

    lat = serializers.FloatField()
    lng = serializers.FloatField()
    display_name = serializers.CharField()
    place_id = serializers.IntegerField(required=False)
