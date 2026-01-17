import { useState } from 'react';
import {
  DUTY_STATUS,
  DUTY_STATUS_COLORS,
  STOP_TYPE_COLORS,
  formatHours,
  formatTime,
  formatDate,
} from '../../constants/hos';

/**
 * TripSchedule Component
 * Displays day-by-day breakdown of the trip schedule with timeline visualization
 */
const TripSchedule = ({ schedule, stops }) => {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!schedule || schedule.length === 0) {
    return null;
  }

  const currentDaySchedule = schedule.find((s) => s.day === selectedDay) || schedule[0];
  const dayStops = stops?.filter((s) => s.day === selectedDay) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Trip Schedule</h2>
        <p className="text-sm text-gray-600">Day-by-day breakdown of your HOS-compliant schedule</p>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-2 md:px-4">
        {schedule.map((day) => (
          <button
            key={day.day}
            onClick={() => setSelectedDay(day.day)}
            className={`
              flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-[2px] min-h-[48px]
              ${selectedDay === day.day
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex flex-col items-center">
              <span>Day {day.day}</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {formatDate(day.date)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Day Content */}
      <div className="p-4 md:p-6">
        {/* Hours Summary Bar */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 md:gap-4 mb-3">
            <HoursIndicator
              label="Driving"
              hours={currentDaySchedule.driving_hours}
              color="green"
            />
            <HoursIndicator
              label="On Duty"
              hours={currentDaySchedule.on_duty_hours}
              color="yellow"
            />
            <HoursIndicator
              label="Off Duty"
              hours={currentDaySchedule.off_duty_hours}
              color="gray"
            />
            <HoursIndicator
              label="Sleeper"
              hours={currentDaySchedule.sleeper_hours}
              color="purple"
            />
          </div>

          {/* Visual timeline bar */}
          <div className="h-4 md:h-6 rounded-full overflow-hidden flex bg-gray-100">
            {currentDaySchedule.driving_hours > 0 && (
              <div
                className="bg-green-400"
                style={{ width: `${(currentDaySchedule.driving_hours / 24) * 100}%` }}
                title={`Driving: ${formatHours(currentDaySchedule.driving_hours)}`}
              />
            )}
            {currentDaySchedule.on_duty_hours > 0 && (
              <div
                className="bg-yellow-400"
                style={{ width: `${(currentDaySchedule.on_duty_hours / 24) * 100}%` }}
                title={`On Duty: ${formatHours(currentDaySchedule.on_duty_hours)}`}
              />
            )}
            {currentDaySchedule.sleeper_hours > 0 && (
              <div
                className="bg-purple-400"
                style={{ width: `${(currentDaySchedule.sleeper_hours / 24) * 100}%` }}
                title={`Sleeper: ${formatHours(currentDaySchedule.sleeper_hours)}`}
              />
            )}
            {currentDaySchedule.off_duty_hours > 0 && (
              <div
                className="bg-gray-300"
                style={{ width: `${(currentDaySchedule.off_duty_hours / 24) * 100}%` }}
                title={`Off Duty: ${formatHours(currentDaySchedule.off_duty_hours)}`}
              />
            )}
          </div>
        </div>

        {/* Remaining Hours */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">Driving Remaining</p>
            <p className="text-lg font-semibold text-green-700">
              {formatHours(currentDaySchedule.driving_remaining)}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs text-yellow-600 font-medium">On-Duty Window Remaining</p>
            <p className="text-lg font-semibold text-yellow-700">
              {formatHours(currentDaySchedule.on_duty_remaining)}
            </p>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Day Activities</h3>
          
          {currentDaySchedule.activities && currentDaySchedule.activities.length > 0 ? (
            <div className="space-y-2">
              {currentDaySchedule.activities.map((activity, index) => (
                <ActivityCard key={index} activity={activity} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No activities recorded for this day.</p>
          )}
        </div>

        {/* Day Stops */}
        {dayStops.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stops</h3>
            <div className="space-y-2">
              {dayStops.map((stop, index) => (
                <StopCard key={index} stop={stop} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hours Indicator - small summary badge
 */
const HoursIndicator = ({ label, hours, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      <span className="opacity-75">{label}:</span>{' '}
      <span className="font-semibold">{formatHours(hours)}</span>
    </div>
  );
};

/**
 * Activity Card - individual activity in the timeline
 */
const ActivityCard = ({ activity }) => {
  const statusColors = DUTY_STATUS_COLORS[activity.duty_status] || DUTY_STATUS_COLORS[DUTY_STATUS.ON_DUTY];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${statusColors.border} ${statusColors.bg}`}>
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors.bg}`}>
          <ActivityIcon type={activity.type} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${statusColors.text}`}>
            {activity.description}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text}`}>
            {statusColors.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
          <span className="mx-2">•</span>
          {formatHours(activity.duration_hours)}
        </p>
      </div>
    </div>
  );
};

/**
 * Stop Card - individual stop in the list
 */
const StopCard = ({ stop }) => {
  const stopColors = STOP_TYPE_COLORS[stop.type] || STOP_TYPE_COLORS.start;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${stopColors.bg}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{stop.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${stopColors.light} ${stopColors.text}`}>
            {stopColors.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{stop.address}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTime(stop.arrival)}
          {stop.duration_minutes > 0 && (
            <>
              <span className="mx-1">•</span>
              {stop.duration_minutes} min stop
            </>
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * Activity Icon based on activity type
 */
const ActivityIcon = ({ type }) => {
  const iconClass = "w-4 h-4 text-gray-600";

  switch (type) {
    case 'driving':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'pre_trip':
    case 'post_trip':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'pickup':
    case 'dropoff':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'break':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'rest':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    case 'fuel':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default TripSchedule;
