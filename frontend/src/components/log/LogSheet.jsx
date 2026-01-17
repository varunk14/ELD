import { useMemo } from 'react';
import { DUTY_STATUS, DUTY_STATUS_COLORS, formatDate } from '../../constants/hos';

/**
 * LogSheet Component
 * Renders an SVG-based ELD log sheet matching the DOT driver's daily log format.
 *
 * The log displays:
 * - 24-hour grid with hour markers
 * - 4 duty status rows (Off Duty, Sleeper Berth, Driving, On Duty)
 * - Horizontal lines showing duration in each status
 * - Vertical lines connecting status changes
 * - Header with date, driver info, miles
 * - Hours totals (must equal 24)
 * - Remarks section with activities
 */

// SVG dimensions and layout constants
const SVG_WIDTH = 900;
const SVG_HEIGHT = 500;
const GRID_LEFT = 120;
const GRID_RIGHT = 820;
const GRID_TOP = 95;
const GRID_BOTTOM = 255;
const GRID_WIDTH = GRID_RIGHT - GRID_LEFT;
const ROW_HEIGHT = (GRID_BOTTOM - GRID_TOP) / 4;
const HOUR_WIDTH = GRID_WIDTH / 24;

// Duty status row positions (from top to bottom)
const DUTY_STATUS_ROWS = {
  [DUTY_STATUS.OFF_DUTY]: 0,
  [DUTY_STATUS.SLEEPER_BERTH]: 1,
  [DUTY_STATUS.DRIVING]: 2,
  [DUTY_STATUS.ON_DUTY]: 3,
};

const DUTY_STATUS_LABELS = [
  { key: DUTY_STATUS.OFF_DUTY, label: '1. Off Duty' },
  { key: DUTY_STATUS.SLEEPER_BERTH, label: '2. Sleeper Berth' },
  { key: DUTY_STATUS.DRIVING, label: '3. Driving' },
  { key: DUTY_STATUS.ON_DUTY, label: '4. On Duty (Not Driving)' },
];

// Hour labels (MID, 1, 2...11, NOON, 1, 2...11, MID)
const HOUR_LABELS = [
  'M', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
  'N', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'M'
];

/**
 * Convert time string to hour decimal (0-24)
 */
const timeToHour = (timeStr) => {
  if (!timeStr) return 0;
  try {
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.getHours() + date.getMinutes() / 60;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes || 0) / 60;
  } catch {
    return 0;
  }
};

/**
 * Convert hour (0-24) to X coordinate
 */
const hourToX = (hour) => {
  return GRID_LEFT + (hour / 24) * GRID_WIDTH;
};

/**
 * Get Y coordinate for duty status row
 */
const statusToY = (status) => {
  const row = DUTY_STATUS_ROWS[status] ?? 3;
  return GRID_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2;
};

/**
 * Format hours for display
 */
const formatHoursDecimal = (hours) => {
  if (hours === 0 || hours === undefined || hours === null) return '0';
  return hours.toFixed(1).replace('.0', '');
};

/**
 * Generate remarks from activities
 */
const generateRemarks = (activities) => {
  if (!activities) return [];

  const remarks = [];
  activities.forEach((activity) => {
    if (activity.start_time && activity.description) {
      const time = new Date(activity.start_time);
      const timeStr = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      remarks.push({
        time: timeStr,
        text: activity.description,
      });
    }
  });

  return remarks.slice(0, 6);
};

const LogSheet = ({ daySchedule, tripInfo, driverInfo }) => {
  // Process activities to create line segments
  const lineSegments = useMemo(() => {
    if (!daySchedule?.activities) return [];

    const segments = [];
    let prevStatus = null;

    daySchedule.activities.forEach((activity) => {
      const startHour = timeToHour(activity.start_time);
      const endHour = timeToHour(activity.end_time);
      const status = activity.duty_status;

      const adjustedEndHour = endHour < startHour ? 24 : endHour;
      const startX = hourToX(startHour);
      const endX = hourToX(Math.min(adjustedEndHour, 24));
      const y = statusToY(status);

      // Vertical line if status changed
      if (prevStatus !== null && prevStatus !== status) {
        const prevY = statusToY(prevStatus);
        segments.push({
          type: 'vertical',
          x: startX,
          y1: Math.min(prevY, y),
          y2: Math.max(prevY, y),
        });
      }

      // Horizontal line for activity
      segments.push({
        type: 'horizontal',
        x1: startX,
        x2: endX,
        y: y,
        status: status,
      });

      prevStatus = status;
    });

    return segments;
  }, [daySchedule]);

  // Calculate hours totals
  const hoursTotals = useMemo(() => {
    if (!daySchedule) return { off: 0, sleeper: 0, driving: 0, onDuty: 0, total: 0 };

    const off = daySchedule.off_duty_hours || 0;
    const sleeper = daySchedule.sleeper_hours || 0;
    const driving = daySchedule.driving_hours || 0;
    const onDuty = daySchedule.on_duty_hours || 0;

    return {
      off,
      sleeper,
      driving,
      onDuty,
      total: off + sleeper + driving + onDuty,
    };
  }, [daySchedule]);

  // Generate remarks
  const remarks = useMemo(() => {
    return generateRemarks(daySchedule?.activities);
  }, [daySchedule]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full min-w-[700px] h-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Background */}
        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="white" />

        {/* Title */}
        <text x={SVG_WIDTH / 2} y="22" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111827">
          DRIVER'S DAILY LOG
        </text>
        <text x={SVG_WIDTH / 2} y="38" textAnchor="middle" fontSize="9" fill="#6B7280">
          (24-Hour Period)
        </text>

        {/* Header Fields */}
        <g fontSize="9" fill="#374151">
          <text x="20" y="55">Date:</text>
          <text x="50" y="55" fontWeight="600">{formatDate(daySchedule?.date)}</text>

          <text x="180" y="55">Driver:</text>
          <text x="215" y="55" fontWeight="600">{driverInfo?.name || 'Driver'}</text>

          <text x="380" y="55">Total Miles:</text>
          <text x="440" y="55" fontWeight="600">
            {tripInfo?.totalMiles?.toLocaleString() || '-'}
          </text>

          <text x="550" y="55">Carrier:</text>
          <text x="590" y="55" fontWeight="600">{driverInfo?.company || '-'}</text>

          <text x="750" y="55">Day:</text>
          <text x="775" y="55" fontWeight="600">{daySchedule?.day || 1}</text>
        </g>

        {/* Vehicle Info */}
        <g fontSize="8" fill="#6B7280">
          <text x="20" y="72">Vehicle: {driverInfo?.truckNumber || '-'}</text>
          <text x="120" y="72">Trailer: {driverInfo?.trailerNumber || '-'}</text>
          <text x="220" y="72">Home Terminal: {driverInfo?.homeTerminal || '-'}</text>
        </g>

        {/* Row Labels */}
        <g fontSize="8" fill="#374151">
          {DUTY_STATUS_LABELS.map((status, index) => {
            const y = GRID_TOP + index * ROW_HEIGHT + ROW_HEIGHT / 2;
            return (
              <text key={status.key} x="15" y={y + 3}>
                {status.label}
              </text>
            );
          })}
        </g>

        {/* Grid Background */}
        <rect
          x={GRID_LEFT}
          y={GRID_TOP}
          width={GRID_WIDTH}
          height={GRID_BOTTOM - GRID_TOP}
          fill="#FAFAFA"
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Horizontal Row Dividers */}
        {[1, 2, 3].map((i) => (
          <line
            key={i}
            x1={GRID_LEFT}
            y1={GRID_TOP + i * ROW_HEIGHT}
            x2={GRID_RIGHT}
            y2={GRID_TOP + i * ROW_HEIGHT}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}

        {/* Vertical Hour Lines */}
        {HOUR_LABELS.map((_, i) => (
          <line
            key={i}
            x1={GRID_LEFT + i * HOUR_WIDTH}
            y1={GRID_TOP}
            x2={GRID_LEFT + i * HOUR_WIDTH}
            y2={GRID_BOTTOM}
            stroke={i === 0 || i === 12 || i === 24 ? '#9CA3AF' : '#E5E7EB'}
            strokeWidth={i === 0 || i === 12 || i === 24 ? 1.5 : 0.5}
          />
        ))}

        {/* 15-min Subdivision Lines */}
        {Array.from({ length: 96 }).map((_, i) => {
          if (i % 4 === 0) return null;
          const x = GRID_LEFT + (i / 96) * GRID_WIDTH;
          return (
            <line
              key={`q-${i}`}
              x1={x}
              y1={GRID_TOP}
              x2={x}
              y2={GRID_BOTTOM}
              stroke="#F3F4F6"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Hour Labels at Top */}
        <g fontSize="7" fill="#6B7280" textAnchor="middle">
          {HOUR_LABELS.map((label, i) => (
            <text key={i} x={GRID_LEFT + i * HOUR_WIDTH} y={GRID_TOP - 5}>
              {label}
            </text>
          ))}
        </g>

        {/* AM/PM Indicators */}
        <text x={GRID_LEFT + GRID_WIDTH * 0.25} y={GRID_TOP - 15} fontSize="8" fill="#9CA3AF" textAnchor="middle">
          MIDNIGHT TO NOON
        </text>
        <text x={GRID_LEFT + GRID_WIDTH * 0.75} y={GRID_TOP - 15} fontSize="8" fill="#9CA3AF" textAnchor="middle">
          NOON TO MIDNIGHT
        </text>

        {/* Duty Status Lines */}
        <g>
          {lineSegments.map((segment, index) => {
            if (segment.type === 'horizontal') {
              const color = DUTY_STATUS_COLORS[segment.status]?.fill || '#374151';
              return (
                <line
                  key={`h-${index}`}
                  x1={segment.x1}
                  y1={segment.y}
                  x2={segment.x2}
                  y2={segment.y}
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            } else {
              return (
                <line
                  key={`v-${index}`}
                  x1={segment.x}
                  y1={segment.y1}
                  x2={segment.x}
                  y2={segment.y2}
                  stroke="#374151"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            }
          })}
        </g>

        {/* Hours Totals (Right Side) */}
        <g fontSize="8" fill="#374151">
          <text x={GRID_RIGHT + 15} y={GRID_TOP - 8} fontWeight="bold" fontSize="7">
            TOTAL HRS
          </text>

          {/* Off Duty */}
          <rect x={GRID_RIGHT + 5} y={GRID_TOP + 2} width="65" height={ROW_HEIGHT - 4} fill="#F9FAFB" stroke="#E5E7EB" />
          <text x={GRID_RIGHT + 37} y={GRID_TOP + ROW_HEIGHT / 2 + 3} textAnchor="middle" fontWeight="600">
            {formatHoursDecimal(hoursTotals.off)}
          </text>

          {/* Sleeper */}
          <rect x={GRID_RIGHT + 5} y={GRID_TOP + ROW_HEIGHT + 2} width="65" height={ROW_HEIGHT - 4} fill="#F9FAFB" stroke="#E5E7EB" />
          <text x={GRID_RIGHT + 37} y={GRID_TOP + ROW_HEIGHT * 1.5 + 3} textAnchor="middle" fontWeight="600">
            {formatHoursDecimal(hoursTotals.sleeper)}
          </text>

          {/* Driving */}
          <rect x={GRID_RIGHT + 5} y={GRID_TOP + ROW_HEIGHT * 2 + 2} width="65" height={ROW_HEIGHT - 4} fill="#F9FAFB" stroke="#E5E7EB" />
          <text x={GRID_RIGHT + 37} y={GRID_TOP + ROW_HEIGHT * 2.5 + 3} textAnchor="middle" fontWeight="600">
            {formatHoursDecimal(hoursTotals.driving)}
          </text>

          {/* On Duty */}
          <rect x={GRID_RIGHT + 5} y={GRID_TOP + ROW_HEIGHT * 3 + 2} width="65" height={ROW_HEIGHT - 4} fill="#F9FAFB" stroke="#E5E7EB" />
          <text x={GRID_RIGHT + 37} y={GRID_TOP + ROW_HEIGHT * 3.5 + 3} textAnchor="middle" fontWeight="600">
            {formatHoursDecimal(hoursTotals.onDuty)}
          </text>

          {/* Total */}
          <rect x={GRID_RIGHT + 5} y={GRID_BOTTOM + 5} width="65" height="18" fill="#EEF2FF" stroke="#C7D2FE" />
          <text x={GRID_RIGHT + 37} y={GRID_BOTTOM + 17} textAnchor="middle" fontWeight="bold" fontSize="9">
            {formatHoursDecimal(hoursTotals.total)}
          </text>
        </g>

        {/* Legend */}
        <g transform={`translate(20, ${GRID_BOTTOM + 12})`}>
          <text fontSize="7" fontWeight="bold" fill="#374151">LEGEND:</text>
          {DUTY_STATUS_LABELS.map((status, i) => (
            <g key={status.key} transform={`translate(${55 + i * 165}, 0)`}>
              <rect x="0" y="-5" width="10" height="6" fill={DUTY_STATUS_COLORS[status.key].fill} stroke="#D1D5DB" strokeWidth="0.5" />
              <text x="14" y="0" fontSize="7" fill="#6B7280">{status.label}</text>
            </g>
          ))}
        </g>

        {/* Remarks Section */}
        <g transform={`translate(20, ${GRID_BOTTOM + 32})`}>
          <text fontSize="9" fontWeight="bold" fill="#374151">REMARKS:</text>
          <rect x="0" y="8" width={SVG_WIDTH - 40} height="75" fill="#FAFAFA" stroke="#E5E7EB" rx="3" />

          <g transform="translate(8, 20)">
            {remarks.length > 0 ? (
              remarks.map((remark, i) => (
                <text key={i} y={i * 12} fontSize="8" fill="#374151">
                  <tspan fontWeight="600">{remark.time}</tspan>
                  <tspan> - {remark.text.substring(0, 90)}</tspan>
                </text>
              ))
            ) : (
              <text fontSize="8" fill="#9CA3AF" fontStyle="italic">No remarks</text>
            )}
          </g>
        </g>

        {/* Signature */}
        <g transform={`translate(${SVG_WIDTH - 220}, ${SVG_HEIGHT - 30})`}>
          <text fontSize="8" fill="#6B7280">Driver Signature:</text>
          <line x1="80" y1="0" x2="190" y2="0" stroke="#D1D5DB" strokeWidth="1" />
        </g>

        {/* Footer */}
        <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 8} textAnchor="middle" fontSize="7" fill="#9CA3AF">
          Generated by ELD Trip Planner
        </text>
      </svg>
    </div>
  );
};

export default LogSheet;
