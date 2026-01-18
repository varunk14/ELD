import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripAPI } from '../services/api';
import TripMap from '../components/map/TripMap';
import { TripSchedule, HoursSummary } from '../components/trip';
import { LogViewer } from '../components/log';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      setIsLoading(true);
      const response = await tripAPI.get(id);
      setTrip(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trip:', err);
      setError('Failed to load trip');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // Build location objects for the map
  const currentLocation = {
    lat: parseFloat(trip.current_location_lat),
    lng: parseFloat(trip.current_location_lng),
    display_name: trip.current_location,
  };
  const pickupLocation = {
    lat: parseFloat(trip.pickup_location_lat),
    lng: parseFloat(trip.pickup_location_lng),
    display_name: trip.pickup_location,
  };
  const dropoffLocation = {
    lat: parseFloat(trip.dropoff_location_lat),
    lng: parseFloat(trip.dropoff_location_lng),
    display_name: trip.dropoff_location,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to History
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Trip Details
            </h1>
          </div>
        </div>

        {/* Trip Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Distance</p>
              <p className="text-xl font-semibold text-gray-900">
                {trip.total_distance_miles?.toLocaleString()} miles
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Driving Time</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatDuration(trip.total_driving_hours)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-xl font-semibold text-gray-900">
                {trip.hos_summary?.total_days || trip.schedule?.length || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cycle Hours</p>
              <p className="text-xl font-semibold text-gray-900">
                {trip.current_cycle_hours} / 70 hrs
              </p>
            </div>
          </div>

          {/* Route */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Start</p>
                  <p className="text-sm text-gray-900">{trip.current_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm text-gray-900">{trip.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Dropoff</p>
                  <p className="text-sm text-gray-900">{trip.dropoff_location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h2>
          <div className="h-[400px]">
            <TripMap
              routeCoordinates={trip.route_polyline || []}
              currentLocation={currentLocation}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              stops={trip.stops}
              className="h-full"
            />
          </div>
        </div>

        {/* HOS Schedule */}
        {trip.schedule && trip.schedule.length > 0 && (
          <div className="space-y-6">
            <HoursSummary
              hosSummary={trip.hos_summary}
              schedule={trip.schedule}
            />

            <TripSchedule
              schedule={trip.schedule}
              stops={trip.stops}
            />

            <LogViewer
              schedule={trip.schedule}
              tripInfo={{
                totalMiles: trip.total_distance_miles,
              }}
              driverInfo={{
                name: 'Driver',
              }}
              stops={trip.stops}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetail;
