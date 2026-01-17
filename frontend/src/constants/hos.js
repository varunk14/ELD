/**
 * HOS (Hours of Service) Constants
 * Based on FMCSA regulations for property-carrying drivers (70hr/8day)
 */

// HOS Time Limits
export const HOS_LIMITS = {
  DRIVING_LIMIT: 11, // hours - max driving after 10 consecutive hours off
  ON_DUTY_WINDOW: 14, // hours - on-duty window cannot extend beyond 14 hours
  BREAK_REQUIRED_AFTER: 8, // hours - must take 30-min break after 8 hours driving
  BREAK_DURATION: 0.5, // hours (30 minutes)
  OFF_DUTY_REQUIRED: 10, // hours - must have 10 consecutive hours off before driving
  CYCLE_LIMIT: 70, // hours - cannot drive after 70 on-duty hours in 8 days
  CYCLE_DAYS: 8, // days
  RESTART_DURATION: 34, // hours - resets 70-hour clock to zero
};

// Activity Durations
export const ACTIVITY_DURATIONS = {
  PRE_TRIP_INSPECTION: 0.5, // hours (30 minutes)
  POST_TRIP_INSPECTION: 0.5, // hours (30 minutes)
  PICKUP: 1.0, // hours
  DROPOFF: 1.0, // hours
  FUELING: 0.5, // hours (30 minutes)
};

// Fuel interval
export const FUEL_INTERVAL_MILES = 1000;

// Duty Status Types
export const DUTY_STATUS = {
  OFF_DUTY: 'off_duty',
  SLEEPER_BERTH: 'sleeper_berth',
  DRIVING: 'driving',
  ON_DUTY: 'on_duty',
};

// Stop Types
export const STOP_TYPES = {
  START: 'start',
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
  FUEL: 'fuel',
  REST_30MIN: 'rest_30min',
  REST_10HR: 'rest_10hr',
  REST_34HR: 'rest_34hr',
};

// Colors for duty status visualization
export const DUTY_STATUS_COLORS = {
  [DUTY_STATUS.OFF_DUTY]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    fill: '#e5e7eb', // gray-200
    label: 'Off Duty',
  },
  [DUTY_STATUS.SLEEPER_BERTH]: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    fill: '#c4b5fd', // purple-300
    label: 'Sleeper Berth',
  },
  [DUTY_STATUS.DRIVING]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    fill: '#86efac', // green-300
    label: 'Driving',
  },
  [DUTY_STATUS.ON_DUTY]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    fill: '#fde047', // yellow-300
    label: 'On Duty (Not Driving)',
  },
};

// Colors for stop types
export const STOP_TYPE_COLORS = {
  [STOP_TYPES.START]: {
    bg: 'bg-blue-500',
    text: 'text-blue-700',
    light: 'bg-blue-100',
    label: 'Start',
    icon: 'circle',
  },
  [STOP_TYPES.PICKUP]: {
    bg: 'bg-green-500',
    text: 'text-green-700',
    light: 'bg-green-100',
    label: 'Pickup',
    icon: 'package',
  },
  [STOP_TYPES.DROPOFF]: {
    bg: 'bg-red-500',
    text: 'text-red-700',
    light: 'bg-red-100',
    label: 'Dropoff',
    icon: 'flag',
  },
  [STOP_TYPES.FUEL]: {
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    light: 'bg-orange-100',
    label: 'Fuel',
    icon: 'fuel',
  },
  [STOP_TYPES.REST_30MIN]: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-700',
    light: 'bg-yellow-100',
    label: '30-min Break',
    icon: 'coffee',
  },
  [STOP_TYPES.REST_10HR]: {
    bg: 'bg-purple-500',
    text: 'text-purple-700',
    light: 'bg-purple-100',
    label: '10-hr Rest',
    icon: 'bed',
  },
  [STOP_TYPES.REST_34HR]: {
    bg: 'bg-indigo-500',
    text: 'text-indigo-700',
    light: 'bg-indigo-100',
    label: '34-hr Restart',
    icon: 'moon',
  },
};

/**
 * Format hours to human-readable string
 * @param {number} hours - Hours as decimal
 * @returns {string} Formatted string (e.g., "3 hr 30 min")
 */
export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

/**
 * Format time string (ISO) to display time
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time (e.g., "7:30 AM")
 */
export const formatTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '-';
  }
};

/**
 * Format date string (ISO) to display date
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 17, 2026")
 */
export const formatDate = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

export default {
  HOS_LIMITS,
  ACTIVITY_DURATIONS,
  FUEL_INTERVAL_MILES,
  DUTY_STATUS,
  STOP_TYPES,
  DUTY_STATUS_COLORS,
  STOP_TYPE_COLORS,
  formatHours,
  formatTime,
  formatDate,
};
