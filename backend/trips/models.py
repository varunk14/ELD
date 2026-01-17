import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Trip(models.Model):
    """Model representing a trip with route information."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips'
    )

    # Locations
    current_location = models.CharField(max_length=500)
    current_location_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    current_location_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    pickup_location = models.CharField(max_length=500)
    pickup_location_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    pickup_location_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    dropoff_location = models.CharField(max_length=500)
    dropoff_location_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )
    dropoff_location_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    # HOS tracking
    current_cycle_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(70)
        ]
    )

    # Trip summary (calculated)
    total_distance_miles = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True
    )
    total_driving_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Route data (stored as JSON for the polyline coordinates)
    route_polyline = models.JSONField(
        default=list,
        blank=True
    )

    # Full schedule data (stored as JSON)
    schedule = models.JSONField(
        default=list,
        blank=True
    )

    # Stops data (stored as JSON)
    stops = models.JSONField(
        default=list,
        blank=True
    )

    # HOS Summary (stored as JSON)
    hos_summary = models.JSONField(
        default=dict,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'trip'
        verbose_name_plural = 'trips'

    def __str__(self):
        return f"{self.current_location} → {self.dropoff_location}"
