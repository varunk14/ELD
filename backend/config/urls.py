"""
URL configuration for ELD Trip Planner project.
"""
from django.contrib import admin
from django.urls import path, include
from trips.urls import geocode_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/trips/', include('trips.urls')),
    path('api/geocode/', include(geocode_urlpatterns)),
]
