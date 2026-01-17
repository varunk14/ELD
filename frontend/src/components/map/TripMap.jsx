import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in Leaflet with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const markerIcons = {
  start: createIcon('#3B82F6'),       // blue-500
  pickup: createIcon('#22C55E'),      // green-500
  dropoff: createIcon('#EF4444'),     // red-500
  fuel: createIcon('#F97316'),        // orange-500
  rest_30min: createIcon('#EAB308'),  // yellow-500
  rest_10hr: createIcon('#8B5CF6'),   // purple-500
  rest_34hr: createIcon('#1E40AF'),   // blue-800
};

// Component to fit map bounds to route
const FitBounds = ({ routeCoordinates, markers }) => {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoordinates, markers, map]);

  return null;
};

// Stop type labels for display
const stopTypeLabels = {
  start: 'Start',
  pickup: 'Pickup',
  dropoff: 'Dropoff',
  fuel: 'Fuel Stop',
  rest_30min: '30-min Break',
  rest_10hr: '10-hr Rest',
  rest_34hr: '34-hr Restart',
};

const TripMap = ({
  routeCoordinates = [],
  currentLocation = null,
  pickupLocation = null,
  dropoffLocation = null,
  stops = [],
  className = '',
}) => {
  // Default center (center of US)
  const defaultCenter = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Build markers array from primary locations
  const markers = [];
  if (currentLocation) {
    markers.push({
      ...currentLocation,
      type: 'start',
      label: 'Start',
    });
  }
  if (pickupLocation) {
    markers.push({
      ...pickupLocation,
      type: 'pickup',
      label: 'Pickup',
    });
  }
  if (dropoffLocation) {
    markers.push({
      ...dropoffLocation,
      type: 'dropoff',
      label: 'Dropoff',
    });
  }

  // Add HOS stops (breaks, rest periods, fuel)
  const hosStops = (stops || []).filter(
    (stop) => ['fuel', 'rest_30min', 'rest_10hr', 'rest_34hr'].includes(stop.type)
  ).map((stop) => ({
    lat: stop.coordinates?.lat || 0,
    lng: stop.coordinates?.lng || 0,
    type: stop.type,
    label: stopTypeLabels[stop.type] || stop.type,
    name: stop.name,
    address: stop.address,
    activity: stop.activity,
    duration_minutes: stop.duration_minutes,
  }));

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Primary Markers (Start, Pickup, Dropoff) */}
        {markers.map((marker, index) => (
          <Marker
            key={`${marker.type}-${index}`}
            position={[marker.lat, marker.lng]}
            icon={markerIcons[marker.type]}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-gray-900">{marker.label}</strong>
                <p className="text-gray-600 mt-1">
                  {marker.display_name || marker.address || `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* HOS Stops Markers (Breaks, Rest, Fuel) */}
        {hosStops.map((stop, index) => (
          <Marker
            key={`hos-${stop.type}-${index}`}
            position={[stop.lat, stop.lng]}
            icon={markerIcons[stop.type] || markerIcons.start}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-gray-900">{stop.label}</strong>
                {stop.name && (
                  <p className="text-gray-700 font-medium mt-1">{stop.name}</p>
                )}
                {stop.address && (
                  <p className="text-gray-500 text-xs mt-0.5">{stop.address}</p>
                )}
                {stop.activity && (
                  <p className="text-gray-600 mt-1">{stop.activity}</p>
                )}
                {stop.duration_minutes > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    Duration: {stop.duration_minutes} min
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fit bounds to route or markers */}
        <FitBounds routeCoordinates={routeCoordinates} markers={markers} />
      </MapContainer>

      {/* Map legend - responsive positioning */}
      {(markers.length > 0 || hosStops.length > 0) && (
        <div className="absolute bottom-3 left-2 lg:bottom-4 lg:left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 lg:p-3 z-[1000] max-w-[140px] lg:max-w-none">
          <div className="text-[10px] lg:text-xs font-medium text-gray-700 mb-1.5 lg:mb-2">Legend</div>
          <div className="space-y-1 lg:space-y-1.5">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-xs text-gray-600">Start</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-xs text-gray-600">Pickup</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-[10px] lg:text-xs text-gray-600">Dropoff</span>
            </div>
            {hosStops.length > 0 && (
              <>
                <div className="border-t border-gray-200 my-1" />
                {hosStops.some(s => s.type === 'fuel') && (
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-orange-500 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-gray-600">Fuel</span>
                  </div>
                )}
                {hosStops.some(s => s.type === 'rest_30min') && (
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-gray-600">30-min Break</span>
                  </div>
                )}
                {hosStops.some(s => s.type === 'rest_10hr') && (
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-gray-600">10-hr Rest</span>
                  </div>
                )}
                {hosStops.some(s => s.type === 'rest_34hr') && (
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-blue-800 flex-shrink-0" />
                    <span className="text-[10px] lg:text-xs text-gray-600">34-hr Restart</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripMap;
