import { HOS_LIMITS, formatHours } from '../../constants/hos';

/**
 * HoursSummary Component
 * Displays a comprehensive summary of trip hours and HOS compliance
 */
const HoursSummary = ({ hosSummary, schedule }) => {
  if (!hosSummary) {
    return null;
  }

  // Calculate totals from schedule if available
  const totalDrivingPerDay = schedule?.map((day) => ({
    day: day.day,
    driving: day.driving_hours,
    onDuty: day.on_duty_hours,
  })) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Hours Summary</h2>
        <p className="text-sm text-gray-600">HOS compliance overview for your trip</p>
      </div>

      <div className="p-4 md:p-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard
            label="Total Trip Hours"
            value={formatHours(hosSummary.total_driving_hours)}
            icon={<DriveIcon />}
            color="blue"
          />
          <StatCard
            label="Total Days"
            value={`${hosSummary.total_days} ${hosSummary.total_days === 1 ? 'day' : 'days'}`}
            icon={<CalendarIcon />}
            color="purple"
          />
          <StatCard
            label="Total Distance"
            value={`${hosSummary.total_distance_miles?.toLocaleString()} mi`}
            icon={<RouteIcon />}
            color="green"
          />
          <StatCard
            label="Cycle Hours Used"
            value={`${hosSummary.cycle_hours_used} / ${HOS_LIMITS.CYCLE_LIMIT} hr`}
            icon={<CycleIcon />}
            color="yellow"
          />
        </div>

        {/* Cycle Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">70-Hour Cycle Usage</span>
            <span className="text-sm text-gray-500">
              {hosSummary.cycle_hours_remaining} hrs remaining
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hosSummary.cycle_hours_used > 60 ? 'bg-red-500' :
                hosSummary.cycle_hours_used > 50 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(hosSummary.cycle_hours_used / HOS_LIMITS.CYCLE_LIMIT) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 hrs</span>
            <span>70 hrs</span>
          </div>
        </div>

        {/* Stops & Breaks Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <BreakCard
            label="30-min Breaks"
            count={hosSummary.required_breaks}
            description="Required after 8 hrs driving"
            icon={<CoffeeIcon />}
            color="yellow"
          />
          <BreakCard
            label="10-hr Rest Periods"
            count={hosSummary.required_rest_stops}
            description="Required after 11 hrs driving"
            icon={<BedIcon />}
            color="purple"
          />
          <BreakCard
            label="34-hr Restarts"
            count={hosSummary.required_restarts}
            description="Resets 70-hr cycle"
            icon={<MoonIcon />}
            color="indigo"
          />
        </div>

        {/* Daily Driving Breakdown */}
        {totalDrivingPerDay.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Driving Hours by Day</h3>
            <div className="space-y-2">
              {totalDrivingPerDay.map((day) => (
                <DayBreakdown
                  key={day.day}
                  day={day.day}
                  drivingHours={day.driving}
                  onDutyHours={day.onDuty}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trip Time Window */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500">Trip Start</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(hosSummary.start_time)}
              </p>
            </div>
            <div className="hidden sm:block text-gray-300">
              <ArrowRightIcon />
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-gray-500">Estimated Arrival</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(hosSummary.end_time)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
};

/**
 * Break Card Component
 */
const BreakCard = ({ label, count, description, icon, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-semibold">{count}</span>
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs opacity-75 mt-0.5">{description}</p>
    </div>
  );
};

/**
 * Day Breakdown Component
 */
const DayBreakdown = ({ day, drivingHours, onDutyHours }) => {
  const drivingPercent = (drivingHours / HOS_LIMITS.DRIVING_LIMIT) * 100;
  const onDutyPercent = ((drivingHours + onDutyHours) / HOS_LIMITS.ON_DUTY_WINDOW) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 w-12 flex-shrink-0">Day {day}</span>
      <div className="flex-1">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="bg-green-400 h-full"
            style={{ width: `${Math.min(drivingPercent, 100)}%` }}
            title={`Driving: ${formatHours(drivingHours)}`}
          />
          <div
            className="bg-yellow-400 h-full"
            style={{ width: `${Math.min(onDutyHours / HOS_LIMITS.ON_DUTY_WINDOW * 100, 100 - drivingPercent)}%` }}
            title={`On Duty: ${formatHours(onDutyHours)}`}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 w-16 flex-shrink-0 text-right">
        {formatHours(drivingHours)}
      </span>
    </div>
  );
};

/**
 * Format DateTime helper
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
};

// Icons
const DriveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RouteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const CycleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CoffeeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const BedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

export default HoursSummary;
