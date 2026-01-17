import { useState } from 'react';
import LogSheet from './LogSheet';
import { formatDate } from '../../constants/hos';

/**
 * LogViewer Component
 * Displays ELD log sheets with day navigation tabs
 */
const LogViewer = ({ schedule, tripInfo, driverInfo }) => {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!schedule || schedule.length === 0) {
    return null;
  }

  const currentDaySchedule = schedule.find((s) => s.day === selectedDay) || schedule[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ELD Log Sheets</h2>
            <p className="text-sm text-gray-600">Official driver's daily log format</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {schedule.length} {schedule.length === 1 ? 'day' : 'days'} total
            </span>
          </div>
        </div>
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

      {/* Log Sheet */}
      <div className="p-4 md:p-6">
        {/* Day Summary */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="bg-green-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-green-600 font-medium">
              Driving: {currentDaySchedule.driving_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-yellow-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-yellow-600 font-medium">
              On Duty: {currentDaySchedule.on_duty_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-purple-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-purple-600 font-medium">
              Sleeper: {currentDaySchedule.sleeper_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="text-xs text-gray-600 font-medium">
              Off Duty: {currentDaySchedule.off_duty_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
        </div>

        {/* Log Sheet SVG */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <LogSheet
            daySchedule={currentDaySchedule}
            tripInfo={tripInfo}
            driverInfo={driverInfo}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
            disabled={selectedDay === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors min-h-[44px]
              ${selectedDay === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous Day
          </button>

          <span className="text-sm text-gray-500">
            Day {selectedDay} of {schedule.length}
          </span>

          <button
            onClick={() => setSelectedDay(Math.min(schedule.length, selectedDay + 1))}
            disabled={selectedDay === schedule.length}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors min-h-[44px]
              ${selectedDay === schedule.length
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            Next Day
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
