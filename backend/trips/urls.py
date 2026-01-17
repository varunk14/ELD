from django.urls import path
from .views import TripCalculateView, GeocodeSearchView

urlpatterns = [
    path('calculate/', TripCalculateView.as_view(), name='trip-calculate'),
]

# Geocode endpoint at top level
geocode_urlpatterns = [
    path('', GeocodeSearchView.as_view(), name='geocode-search'),
]
