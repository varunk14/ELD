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
  start: createIcon('#3B82F6'),    // blue-500
  pickup: createIcon('#22C55E'),   // green-500
  dropoff: createIcon('#EF4444'),  // red-500
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

const TripMap = ({
  routeCoordinates = [],
  currentLocation = null,
  pickupLocation = null,
  dropoffLocation = null,
  className = '',
}) => {
  // Default center (center of US)
  const defaultCenter = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Build markers array
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

        {/* Markers */}
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

        {/* Fit bounds to route or markers */}
        <FitBounds routeCoordinates={routeCoordinates} markers={markers} />
      </MapContainer>

      {/* Map legend - responsive positioning */}
      {markers.length > 0 && (
        <div className="absolute bottom-3 left-2 lg:bottom-4 lg:left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 lg:p-3 z-[1000] max-w-[120px] lg:max-w-none">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default TripMap;
