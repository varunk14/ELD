from django.urls import path
from .views import (
    TripCalculateView,
    TripListView,
    TripDetailView,
    TripDeleteView,
    GeocodeSearchView,
)

urlpatterns = [
    path('', TripListView.as_view(), name='trip-list'),
    path('calculate/', TripCalculateView.as_view(), name='trip-calculate'),
    path('<uuid:id>/', TripDetailView.as_view(), name='trip-detail'),
    path('<uuid:id>/delete/', TripDeleteView.as_view(), name='trip-delete'),
]

# Geocode endpoint at top level
geocode_urlpatterns = [
    path('', GeocodeSearchView.as_view(), name='geocode-search'),
]
