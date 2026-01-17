"""
Mock data service for development and testing.

Provides mock geocoding and routing without external API dependencies.
TODO: Remove or disable when integrating real APIs in production.
"""
import math
import random
from typing import Optional

# Mock location data for US cities
MOCK_LOCATIONS = {
    # Format: "City, State" -> (latitude, longitude, full_display_name)
    "green bay, wi": (44.5133, -88.0133, "Green Bay, Brown County, Wisconsin, USA"),
    "chicago, il": (41.8781, -87.6298, "Chicago, Cook County, Illinois, USA"),
    "dallas, tx": (32.7767, -96.7970, "Dallas, Dallas County, Texas, USA"),
    "los angeles, ca": (34.0522, -118.2437, "Los Angeles, Los Angeles County, California, USA"),
    "new york, ny": (40.7128, -74.0060, "New York City, New York, USA"),
    "miami, fl": (25.7617, -80.1918, "Miami, Miami-Dade County, Florida, USA"),
    "seattle, wa": (47.6062, -122.3321, "Seattle, King County, Washington, USA"),
    "denver, co": (39.7392, -104.9903, "Denver, Denver County, Colorado, USA"),
    "atlanta, ga": (33.7490, -84.3880, "Atlanta, Fulton County, Georgia, USA"),
    "phoenix, az": (33.4484, -112.0740, "Phoenix, Maricopa County, Arizona, USA"),
    "milwaukee, wi": (43.0389, -87.9065, "Milwaukee, Milwaukee County, Wisconsin, USA"),
    "madison, wi": (43.0731, -89.4012, "Madison, Dane County, Wisconsin, USA"),
    "houston, tx": (29.7604, -95.3698, "Houston, Harris County, Texas, USA"),
    "san francisco, ca": (37.7749, -122.4194, "San Francisco, San Francisco County, California, USA"),
    "boston, ma": (42.3601, -71.0589, "Boston, Suffolk County, Massachusetts, USA"),
    "las vegas, nv": (36.1699, -115.1398, "Las Vegas, Clark County, Nevada, USA"),
    "nashville, tn": (36.1627, -86.7816, "Nashville, Davidson County, Tennessee, USA"),
    "kansas city, mo": (39.0997, -94.5786, "Kansas City, Jackson County, Missouri, USA"),
    "salt lake city, ut": (40.7608, -111.8910, "Salt Lake City, Salt Lake County, Utah, USA"),
    "minneapolis, mn": (44.9778, -93.2650, "Minneapolis, Hennepin County, Minnesota, USA"),
    "omaha, ne": (41.2565, -95.9345, "Omaha, Douglas County, Nebraska, USA"),
    "oklahoma city, ok": (35.4676, -97.5164, "Oklahoma City, Oklahoma County, Oklahoma, USA"),
    "albuquerque, nm": (35.0844, -106.6504, "Albuquerque, Bernalillo County, New Mexico, USA"),
    "st. louis, mo": (38.6270, -90.1994, "St. Louis, Missouri, USA"),
    "indianapolis, in": (39.7684, -86.1581, "Indianapolis, Marion County, Indiana, USA"),
}

# US bounds for random coordinate generation
US_BOUNDS = {
    "lat_min": 25.0,
    "lat_max": 49.0,
    "lng_min": -125.0,
    "lng_max": -67.0,
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
    
    Returns:
        Distance in miles
    """
    R = 3959  # Earth's radius in miles
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def normalize_location(location: str) -> str:
    """Normalize location string for lookup."""
    return location.lower().strip()


def mock_geocode(address: str) -> Optional[dict]:
    """
    Mock geocoding - returns coordinates for known cities or generates random ones.
    
    Args:
        address: Address string to geocode
    
    Returns:
        dict with lat, lng, display_name or None
    """
    normalized = normalize_location(address)
    
    # Check for exact match
    if normalized in MOCK_LOCATIONS:
        lat, lng, display_name = MOCK_LOCATIONS[normalized]
        return {
            "lat": lat,
            "lng": lng,
            "display_name": display_name,
        }
    
    # Check for partial match (city name contained in address)
    for key, (lat, lng, display_name) in MOCK_LOCATIONS.items():
        city_name = key.split(",")[0].strip()
        if city_name in normalized or normalized in city_name:
            return {
                "lat": lat,
                "lng": lng,
                "display_name": display_name,
            }
    
    # Generate random coordinates within US bounds for unknown locations
    random_lat = random.uniform(US_BOUNDS["lat_min"], US_BOUNDS["lat_max"])
    random_lng = random.uniform(US_BOUNDS["lng_min"], US_BOUNDS["lng_max"])
    
    return {
        "lat": round(random_lat, 6),
        "lng": round(random_lng, 6),
        "display_name": f"{address}, USA (Mock Location)",
    }


def mock_search(query: str, limit: int = 5) -> list:
    """
    Mock address search for autocomplete.
    
    Args:
        query: Search query
        limit: Maximum number of results
    
    Returns:
        List of matching locations
    """
    normalized = normalize_location(query)
    results = []
    
    for key, (lat, lng, display_name) in MOCK_LOCATIONS.items():
        # Match if query is contained in the key or display name
        if normalized in key or normalized in display_name.lower():
            results.append({
                "lat": lat,
                "lng": lng,
                "display_name": display_name,
                "place_id": hash(key) % 1000000,  # Mock place ID
            })
            if len(results) >= limit:
                break
    
    return results


def generate_polyline(
    start_lat: float, start_lng: float,
    end_lat: float, end_lng: float,
    num_points: int = 20
) -> list:
    """
    Generate intermediate points for a route polyline.
    
    Creates a realistic-looking route by adding some variation
    to the straight-line path between points.
    
    Args:
        start_lat, start_lng: Starting coordinates
        end_lat, end_lng: Ending coordinates
        num_points: Number of intermediate points
    
    Returns:
        List of [lat, lng] coordinates
    """
    points = []
    
    for i in range(num_points + 1):
        t = i / num_points
        
        # Linear interpolation
        lat = start_lat + (end_lat - start_lat) * t
        lng = start_lng + (end_lng - start_lng) * t
        
        # Add some realistic variation (curves) except at endpoints
        if 0 < i < num_points:
            # Calculate perpendicular offset for natural road curves
            distance = haversine_distance(start_lat, start_lng, end_lat, end_lng)
            max_offset = min(0.5, distance / 500)  # Larger offset for longer routes
            
            # Create gentle curves using sine wave
            curve_factor = math.sin(t * math.pi) * max_offset
            
            # Apply offset perpendicular to route direction
            angle = math.atan2(end_lat - start_lat, end_lng - start_lng)
            lat += curve_factor * math.cos(angle + math.pi / 2) * 0.3
            lng += curve_factor * math.sin(angle + math.pi / 2) * 0.3
        
        points.append([round(lat, 6), round(lng, 6)])
    
    return points


def mock_route(coordinates: list) -> Optional[dict]:
    """
    Calculate mock route between multiple points.
    
    Args:
        coordinates: List of [lng, lat] tuples (ORS format)
    
    Returns:
        Route information including distance, duration, and polyline
    """
    if len(coordinates) < 2:
        return None
    
    total_distance = 0
    all_points = []
    
    # Calculate route through all waypoints
    for i in range(len(coordinates) - 1):
        # Note: coordinates are in [lng, lat] format from ORS convention
        start_lng, start_lat = coordinates[i]
        end_lng, end_lat = coordinates[i + 1]
        
        # Calculate distance for this segment
        segment_distance = haversine_distance(start_lat, start_lng, end_lat, end_lng)
        total_distance += segment_distance
        
        # Adjust for road distance (straight line * 1.3 multiplier for realistic road distance)
        
        # Generate polyline points for this segment
        num_points = max(10, int(segment_distance / 50))  # More points for longer segments
        segment_points = generate_polyline(start_lat, start_lng, end_lat, end_lng, num_points)
        
        # Add points (skip first point for subsequent segments to avoid duplicates)
        if i == 0:
            all_points.extend(segment_points)
        else:
            all_points.extend(segment_points[1:])
    
    # Apply road multiplier (straight-line distance * 1.3 ≈ road distance)
    road_distance = total_distance * 1.3
    
    # Calculate duration (assume average 55 mph for trucking)
    duration_hours = road_distance / 55
    
    return {
        "distance_meters": road_distance * 1609.34,  # Convert to meters
        "duration_seconds": duration_hours * 3600,    # Convert to seconds
        "distance_miles": round(road_distance, 2),
        "duration_hours": round(duration_hours, 2),
        "geometry": all_points,
    }


def mock_trip_route(
    current_location: dict,
    pickup_location: dict,
    dropoff_location: dict,
) -> Optional[dict]:
    """
    Calculate mock route for a complete trip.
    
    Args:
        current_location: dict with 'lat' and 'lng'
        pickup_location: dict with 'lat' and 'lng'
        dropoff_location: dict with 'lat' and 'lng'
    
    Returns:
        Complete route information
    """
    # Build coordinates list (using lng, lat order for consistency with ORS)
    coordinates = [
        [current_location["lng"], current_location["lat"]],
        [pickup_location["lng"], pickup_location["lat"]],
        [dropoff_location["lng"], dropoff_location["lat"]],
    ]
    
    route = mock_route(coordinates)
    
    if route:
        route["segments"] = [
            {"from": "current", "to": "pickup"},
            {"from": "pickup", "to": "dropoff"},
        ]
        route["waypoints"] = {
            "current": current_location,
            "pickup": pickup_location,
            "dropoff": dropoff_location,
        }
    
    return route
