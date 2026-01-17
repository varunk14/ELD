from django.contrib import admin
from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'current_location', 'pickup_location', 'dropoff_location', 'created_at']
    list_filter = ['created_at']
    search_fields = ['current_location', 'pickup_location', 'dropoff_location']
    readonly_fields = ['id', 'created_at', 'updated_at']
