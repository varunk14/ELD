import { useState } from 'react';
import TripForm from '../components/trip/TripForm';
import TripMap from '../components/map/TripMap';
import { TripSchedule, HoursSummary } from '../components/trip';
import { LogViewer } from '../components/log';
import { tripAPI } from '../services/api';

const TripPlanner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tripData, setTripData] = useState(null);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await tripAPI.calculate(formData);
      setTripData(response.data.data);
    } catch (err) {
      console.error('Trip calculation error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message ||
                          'Failed to calculate trip. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format hours into readable format
  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Trip Planner
          </h1>
          <p className="text-gray-600 mt-1">
            Plan your route and generate ELD-compliant log sheets
          </p>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Form */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Trip Details
              </h2>
              <TripForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* Trip Summary - Shows after calculation */}
            {tripData && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Trip Summary
                </h2>
                <div className="space-y-4">
                  {/* Distance */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Distance</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {tripData.total_distance_miles.toLocaleString()} miles
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Driving Time</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatDuration(tripData.total_driving_hours)}
                      </p>
                    </div>
                  </div>

                  {/* Cycle Hours */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cycle Hours Used</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {tripData.current_cycle_hours} / 70 hrs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Info */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Route</h3>
                  <div className="space-y-3">
                    {/* Start */}
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Start</p>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {tripData.current_location.display_name}
                        </p>
                      </div>
                    </div>
                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {tripData.pickup_location.display_name}
                        </p>
                      </div>
                    </div>
                    {/* Dropoff */}
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Dropoff</p>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {tripData.dropoff_location.display_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Map */}
          <div className="flex-1 min-h-[400px] lg:min-h-[600px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full">
              <TripMap
                routeCoordinates={tripData?.route_polyline || []}
                currentLocation={tripData?.current_location}
                pickupLocation={tripData?.pickup_location}
                dropoffLocation={tripData?.dropoff_location}
                stops={tripData?.stops}
                className="h-full min-h-[350px] lg:min-h-[550px]"
              />
            </div>
          </div>
        </div>

        {/* HOS Schedule Section - Shows after calculation */}
        {tripData && tripData.schedule && (
          <div className="mt-6 md:mt-8 space-y-6">
            {/* Hours Summary */}
            <HoursSummary
              hosSummary={tripData.hos_summary}
              schedule={tripData.schedule}
            />

            {/* Trip Schedule */}
            <TripSchedule
              schedule={tripData.schedule}
              stops={tripData.stops}
            />

            {/* ELD Log Sheets */}
            <LogViewer
              schedule={tripData.schedule}
              tripInfo={{
                totalMiles: tripData.total_distance_miles,
              }}
              driverInfo={{
                name: 'Driver',
                company: '',
                truckNumber: '',
                trailerNumber: '',
                homeTerminal: '',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
