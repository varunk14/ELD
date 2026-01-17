"""
HOS (Hours of Service) Calculator Service

Calculates HOS-compliant trip schedules including:
- 11-hour driving limit
- 14-hour on-duty window
- 30-minute break after 8 hours driving
- 10-hour rest periods
- 70-hour/8-day cycle limit
- 34-hour restart

Based on FMCSA regulations for property-carrying drivers.
"""

from datetime import datetime, timedelta
from typing import Optional
from ..constants import HOS, ACTIVITY, FUEL_INTERVAL_MILES, DutyStatus, StopType


class HOSCalculator:
    """
    Calculates HOS-compliant trip schedules.
    """

    def __init__(self):
        # HOS limits from constants
        self.driving_limit = HOS['DRIVING_LIMIT']
        self.on_duty_window = HOS['ON_DUTY_WINDOW']
        self.break_required_after = HOS['BREAK_REQUIRED_AFTER']
        self.break_duration = HOS['BREAK_DURATION']
        self.off_duty_required = HOS['OFF_DUTY_REQUIRED']
        self.cycle_limit = HOS['CYCLE_LIMIT']
        self.cycle_days = HOS['CYCLE_DAYS']
        self.restart_duration = HOS['RESTART_DURATION']

        # Activity durations from constants
        self.pre_trip_duration = ACTIVITY['PRE_TRIP']
        self.post_trip_duration = ACTIVITY['POST_TRIP']
        self.pickup_duration = ACTIVITY['PICKUP']
        self.dropoff_duration = ACTIVITY['DROPOFF']
        self.fueling_duration = ACTIVITY['FUELING']

    def calculate_trip_schedule(
        self,
        total_drive_time: float,
        current_cycle_hours: float,
        total_distance_miles: float,
        start_time: Optional[datetime] = None,
        current_location: Optional[dict] = None,
        pickup_location: Optional[dict] = None,
        dropoff_location: Optional[dict] = None,
    ) -> dict:
        """
        Calculate a complete HOS-compliant trip schedule.

        Args:
            total_drive_time: Total driving hours for the trip
            current_cycle_hours: Hours already used in current 8-day cycle (0-70)
            total_distance_miles: Total trip distance in miles
            start_time: When the trip starts (defaults to now)
            current_location: Starting location info
            pickup_location: Pickup location info
            dropoff_location: Dropoff location info

        Returns:
            dict containing:
                - daily_schedules: List of day-by-day schedules
                - stops: List of all stops with times
                - summary: Overall trip summary
        """
        if start_time is None:
            start_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)

        # Initialize state tracking
        state = {
            'current_time': start_time,
            'drive_hours_today': 0.0,
            'on_duty_hours_today': 0.0,
            'drive_since_break': 0.0,
            'cycle_hours_used': current_cycle_hours,
            'miles_since_fuel': 0.0,
            'current_day': 1,
            'total_drive_time_remaining': total_drive_time,
            'total_miles_remaining': total_distance_miles,
        }

        stops = []
        daily_schedules = []
        activities = []

        # Check if we need a 34-hour restart first
        if state['cycle_hours_used'] >= self.cycle_limit:
            stops.append(self._create_restart_stop(state, current_location))
            state['cycle_hours_used'] = 0
            state['current_day'] += 1

        # Day 1: Start with pre-trip inspection
        day_start_time = state['current_time']
        
        # Add pre-trip inspection
        activities.append(self._create_activity(
            state, 'pre_trip', 'Pre-trip inspection', self.pre_trip_duration
        ))
        self._advance_time(state, self.pre_trip_duration, is_driving=False)
        stops.append(self._create_stop(
            state, StopType.START, 'Starting Location',
            current_location, self.pre_trip_duration * 60, 'Pre-trip inspection'
        ))

        # Calculate drive to pickup
        drive_to_pickup_hours = self._estimate_segment_time(
            total_drive_time, total_distance_miles, 
            current_location, pickup_location, dropoff_location,
            segment='to_pickup'
        )
        drive_to_pickup_miles = self._estimate_segment_distance(
            total_distance_miles,
            current_location, pickup_location, dropoff_location,
            segment='to_pickup'
        )

        # Drive to pickup with HOS compliance
        self._process_driving(
            state, stops, activities,
            drive_to_pickup_hours, drive_to_pickup_miles,
            current_location, pickup_location,
            'Driving to pickup'
        )

        # Pickup stop
        activities.append(self._create_activity(
            state, 'pickup', 'Loading at pickup', self.pickup_duration
        ))
        self._advance_time(state, self.pickup_duration, is_driving=False)
        stops.append(self._create_stop(
            state, StopType.PICKUP, 'Pickup Location',
            pickup_location, self.pickup_duration * 60, 'Loading'
        ))

        # Calculate drive to dropoff
        drive_to_dropoff_hours = state['total_drive_time_remaining']
        drive_to_dropoff_miles = state['total_miles_remaining']

        # Drive to dropoff with HOS compliance
        self._process_driving(
            state, stops, activities,
            drive_to_dropoff_hours, drive_to_dropoff_miles,
            pickup_location, dropoff_location,
            'Driving to dropoff'
        )

        # Dropoff stop
        activities.append(self._create_activity(
            state, 'dropoff', 'Unloading at dropoff', self.dropoff_duration
        ))
        self._advance_time(state, self.dropoff_duration, is_driving=False)
        stops.append(self._create_stop(
            state, StopType.DROPOFF, 'Dropoff Location',
            dropoff_location, self.dropoff_duration * 60, 'Unloading'
        ))

        # Post-trip inspection
        activities.append(self._create_activity(
            state, 'post_trip', 'Post-trip inspection', self.post_trip_duration
        ))
        self._advance_time(state, self.post_trip_duration, is_driving=False)

        # Generate daily schedules from activities
        daily_schedules = self._generate_daily_schedules(
            activities, stops, start_time, state['current_day']
        )

        # Calculate summary
        total_on_duty_hours = sum(
            s['driving_hours'] + s['on_duty_hours'] for s in daily_schedules
        )
        total_off_duty_hours = sum(
            s['off_duty_hours'] + s['sleeper_hours'] for s in daily_schedules
        )

        summary = {
            'total_days': state['current_day'],
            'total_driving_hours': round(total_drive_time, 2),
            'total_on_duty_hours': round(total_on_duty_hours, 2),
            'total_distance_miles': round(total_distance_miles, 2),
            'required_breaks': len([s for s in stops if s['type'] == StopType.REST_30MIN]),
            'required_rest_stops': len([s for s in stops if s['type'] == StopType.REST_10HR]),
            'required_restarts': len([s for s in stops if s['type'] == StopType.REST_34HR]),
            'cycle_hours_used': round(state['cycle_hours_used'], 2),
            'cycle_hours_remaining': round(self.cycle_limit - state['cycle_hours_used'], 2),
            'start_time': start_time.isoformat(),
            'end_time': state['current_time'].isoformat(),
        }

        return {
            'daily_schedules': daily_schedules,
            'stops': stops,
            'summary': summary,
        }

    def _process_driving(
        self, state: dict, stops: list, activities: list,
        drive_hours: float, drive_miles: float,
        from_location: dict, to_location: dict,
        description: str
    ) -> None:
        """
        Process a driving segment with HOS compliance.
        Adds breaks and rest periods as needed.
        """
        remaining_hours = drive_hours
        remaining_miles = drive_miles
        avg_speed = drive_miles / drive_hours if drive_hours > 0 else 55

        while remaining_hours > 0.01:  # Use small threshold to avoid floating point issues
            # Calculate available driving time before hitting any limit
            available_drive = min(
                self.driving_limit - state['drive_hours_today'],
                self.on_duty_window - state['on_duty_hours_today'],
                self.break_required_after - state['drive_since_break'],
                self.cycle_limit - state['cycle_hours_used'],
                remaining_hours
            )

            # Check if we need a stop before driving
            if available_drive <= 0:
                # Determine which limit was hit
                if state['cycle_hours_used'] >= self.cycle_limit:
                    # Post-trip inspection before 34-hour restart
                    activities.append(self._create_activity(
                        state, 'post_trip', 'Post-trip inspection', self.post_trip_duration
                    ))
                    self._advance_time(state, self.post_trip_duration, is_driving=False)
                    
                    # Need 34-hour restart
                    stops.append(self._create_restart_stop(state, to_location))
                    activities.append(self._create_activity(
                        state, 'restart', '34-hour restart', self.restart_duration
                    ))
                    self._take_restart(state)
                    
                    # Pre-trip inspection for new day
                    activities.append(self._create_activity(
                        state, 'pre_trip', 'Pre-trip inspection', self.pre_trip_duration
                    ))
                    self._advance_time(state, self.pre_trip_duration, is_driving=False)
                    continue

                elif (state['drive_hours_today'] >= self.driving_limit or
                      state['on_duty_hours_today'] >= self.on_duty_window):
                    # Post-trip inspection before 10-hour rest
                    activities.append(self._create_activity(
                        state, 'post_trip', 'Post-trip inspection', self.post_trip_duration
                    ))
                    self._advance_time(state, self.post_trip_duration, is_driving=False)
                    
                    # Need 10-hour rest
                    stops.append(self._create_rest_stop(state, to_location))
                    activities.append(self._create_activity(
                        state, 'rest', '10-hour rest period', self.off_duty_required
                    ))
                    self._take_rest(state)
                    
                    # Pre-trip inspection for new day
                    activities.append(self._create_activity(
                        state, 'pre_trip', 'Pre-trip inspection', self.pre_trip_duration
                    ))
                    self._advance_time(state, self.pre_trip_duration, is_driving=False)
                    continue

                elif state['drive_since_break'] >= self.break_required_after:
                    # Need 30-minute break
                    stops.append(self._create_break_stop(state, to_location))
                    activities.append(self._create_activity(
                        state, 'break', '30-minute break', self.break_duration
                    ))
                    self._take_break(state)
                    continue

            # Check if fuel stop is needed
            if state['miles_since_fuel'] >= FUEL_INTERVAL_MILES:
                stops.append(self._create_fuel_stop(state, to_location))
                activities.append(self._create_activity(
                    state, 'fuel', 'Fueling stop', self.fueling_duration
                ))
                self._advance_time(state, self.fueling_duration, is_driving=False)
                state['miles_since_fuel'] = 0

            # Drive for available time
            drive_time = min(available_drive, remaining_hours)
            drive_distance = drive_time * avg_speed

            # Add driving activity
            activities.append(self._create_activity(
                state, 'driving', description, drive_time
            ))
            self._advance_time(state, drive_time, is_driving=True)
            
            # Update remaining
            remaining_hours -= drive_time
            remaining_miles -= drive_distance
            state['total_drive_time_remaining'] -= drive_time
            state['total_miles_remaining'] -= drive_distance
            state['miles_since_fuel'] += drive_distance

    def _advance_time(self, state: dict, hours: float, is_driving: bool = False) -> None:
        """Advance time and update tracking."""
        state['current_time'] += timedelta(hours=hours)
        
        if is_driving:
            state['drive_hours_today'] += hours
            state['on_duty_hours_today'] += hours
            state['drive_since_break'] += hours
            state['cycle_hours_used'] += hours
        else:
            state['on_duty_hours_today'] += hours
            state['cycle_hours_used'] += hours

    def _take_break(self, state: dict) -> None:
        """Take a 30-minute break."""
        state['current_time'] += timedelta(hours=self.break_duration)
        state['drive_since_break'] = 0
        # Break doesn't count toward on-duty or cycle

    def _take_rest(self, state: dict) -> None:
        """Take a 10-hour rest period."""
        state['current_time'] += timedelta(hours=self.off_duty_required)
        state['drive_hours_today'] = 0
        state['on_duty_hours_today'] = 0
        state['drive_since_break'] = 0
        state['current_day'] += 1

    def _take_restart(self, state: dict) -> None:
        """Take a 34-hour restart."""
        state['current_time'] += timedelta(hours=self.restart_duration)
        state['drive_hours_today'] = 0
        state['on_duty_hours_today'] = 0
        state['drive_since_break'] = 0
        state['cycle_hours_used'] = 0
        state['current_day'] += 1

    def _create_stop(
        self, state: dict, stop_type: str, name: str,
        location: Optional[dict], duration_minutes: float, activity: str
    ) -> dict:
        """Create a stop record."""
        arrival = state['current_time'] - timedelta(minutes=duration_minutes)
        
        return {
            'order': len([]) + 1,  # Will be re-indexed later
            'type': stop_type,
            'name': name,
            'address': location.get('display_name', 'Unknown') if location else 'Unknown',
            'coordinates': {
                'lat': location.get('lat', 0) if location else 0,
                'lng': location.get('lng', 0) if location else 0,
            },
            'arrival': arrival.isoformat(),
            'departure': state['current_time'].isoformat(),
            'duration_minutes': int(duration_minutes),
            'activity': activity,
            'day': state['current_day'],
        }

    def _create_break_stop(self, state: dict, location: Optional[dict]) -> dict:
        """Create a 30-minute break stop."""
        return {
            'order': 0,
            'type': StopType.REST_30MIN,
            'name': 'Rest Area',
            'address': self._get_mock_truck_stop_address(location),
            'coordinates': {
                'lat': location.get('lat', 0) if location else 0,
                'lng': location.get('lng', 0) if location else 0,
            },
            'arrival': state['current_time'].isoformat(),
            'departure': (state['current_time'] + timedelta(hours=self.break_duration)).isoformat(),
            'duration_minutes': int(self.break_duration * 60),
            'activity': '30-minute break',
            'day': state['current_day'],
        }

    def _create_rest_stop(self, state: dict, location: Optional[dict]) -> dict:
        """Create a 10-hour rest stop."""
        return {
            'order': 0,
            'type': StopType.REST_10HR,
            'name': 'Truck Stop',
            'address': self._get_mock_truck_stop_address(location),
            'coordinates': {
                'lat': location.get('lat', 0) if location else 0,
                'lng': location.get('lng', 0) if location else 0,
            },
            'arrival': state['current_time'].isoformat(),
            'departure': (state['current_time'] + timedelta(hours=self.off_duty_required)).isoformat(),
            'duration_minutes': int(self.off_duty_required * 60),
            'activity': '10-hour rest period',
            'day': state['current_day'],
        }

    def _create_restart_stop(self, state: dict, location: Optional[dict]) -> dict:
        """Create a 34-hour restart stop."""
        return {
            'order': 0,
            'type': StopType.REST_34HR,
            'name': 'Home Terminal / Truck Stop',
            'address': self._get_mock_truck_stop_address(location),
            'coordinates': {
                'lat': location.get('lat', 0) if location else 0,
                'lng': location.get('lng', 0) if location else 0,
            },
            'arrival': state['current_time'].isoformat(),
            'departure': (state['current_time'] + timedelta(hours=self.restart_duration)).isoformat(),
            'duration_minutes': int(self.restart_duration * 60),
            'activity': '34-hour restart',
            'day': state['current_day'],
        }

    def _create_fuel_stop(self, state: dict, location: Optional[dict]) -> dict:
        """Create a fuel stop."""
        return {
            'order': 0,
            'type': StopType.FUEL,
            'name': 'Fuel Station',
            'address': self._get_mock_truck_stop_address(location),
            'coordinates': {
                'lat': location.get('lat', 0) if location else 0,
                'lng': location.get('lng', 0) if location else 0,
            },
            'arrival': state['current_time'].isoformat(),
            'departure': (state['current_time'] + timedelta(hours=self.fueling_duration)).isoformat(),
            'duration_minutes': int(self.fueling_duration * 60),
            'activity': 'Fueling',
            'day': state['current_day'],
        }

    def _create_activity(
        self, state: dict, activity_type: str, description: str, duration: float
    ) -> dict:
        """Create an activity record."""
        start_time = state['current_time']
        end_time = start_time + timedelta(hours=duration)
        
        # Determine duty status
        if activity_type == 'driving':
            duty_status = DutyStatus.DRIVING
        elif activity_type in ['rest', 'restart']:
            duty_status = DutyStatus.SLEEPER
        elif activity_type == 'break':
            duty_status = DutyStatus.OFF_DUTY
        else:
            duty_status = DutyStatus.ON_DUTY

        return {
            'type': activity_type,
            'description': description,
            'duty_status': duty_status,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_hours': duration,
            'day': state['current_day'],
        }

    def _generate_daily_schedules(
        self, activities: list, stops: list,
        start_time: datetime, total_days: int
    ) -> list:
        """Generate daily schedule breakdown from activities."""
        daily_schedules = []

        for day in range(1, total_days + 1):
            day_activities = [a for a in activities if a['day'] == day]
            day_stops = [s for s in stops if s['day'] == day]

            # Calculate hours by duty status
            driving_hours = sum(
                a['duration_hours'] for a in day_activities
                if a['duty_status'] == DutyStatus.DRIVING
            )
            on_duty_hours = sum(
                a['duration_hours'] for a in day_activities
                if a['duty_status'] == DutyStatus.ON_DUTY
            )
            off_duty_hours = sum(
                a['duration_hours'] for a in day_activities
                if a['duty_status'] == DutyStatus.OFF_DUTY
            )
            sleeper_hours = sum(
                a['duration_hours'] for a in day_activities
                if a['duty_status'] == DutyStatus.SLEEPER
            )

            # Get day boundaries
            if day_activities:
                day_start = day_activities[0]['start_time']
                day_end = day_activities[-1]['end_time']
            else:
                day_start = start_time.isoformat()
                day_end = start_time.isoformat()

            # Calculate remaining hours for the day (to make total = 24)
            total_logged = driving_hours + on_duty_hours + off_duty_hours + sleeper_hours
            if total_logged < 24:
                off_duty_hours += (24 - total_logged)

            daily_schedules.append({
                'day': day,
                'date': (start_time + timedelta(days=day-1)).strftime('%Y-%m-%d'),
                'start_time': day_start,
                'end_time': day_end,
                'driving_hours': round(driving_hours, 2),
                'on_duty_hours': round(on_duty_hours, 2),
                'off_duty_hours': round(off_duty_hours, 2),
                'sleeper_hours': round(sleeper_hours, 2),
                'total_hours': 24.0,
                'activities': day_activities,
                'stops': day_stops,
                'driving_remaining': round(self.driving_limit - driving_hours, 2),
                'on_duty_remaining': round(self.on_duty_window - (driving_hours + on_duty_hours), 2),
            })

        return daily_schedules

    def _estimate_segment_time(
        self, total_time: float, total_miles: float,
        current: dict, pickup: dict, dropoff: dict,
        segment: str
    ) -> float:
        """Estimate driving time for a segment of the trip."""
        # Simple estimation based on straight-line distances
        if segment == 'to_pickup':
            # Approximate 30% of trip is to pickup for most scenarios
            return total_time * 0.3
        else:
            return total_time * 0.7

    def _estimate_segment_distance(
        self, total_miles: float,
        current: dict, pickup: dict, dropoff: dict,
        segment: str
    ) -> float:
        """Estimate driving distance for a segment of the trip."""
        if segment == 'to_pickup':
            return total_miles * 0.3
        else:
            return total_miles * 0.7

    def _get_mock_truck_stop_address(self, location: Optional[dict]) -> str:
        """Generate a mock truck stop address near the location."""
        if not location:
            return "Interstate Rest Area"
        
        # Mock truck stop names
        truck_stops = [
            "Pilot Travel Center",
            "Love's Travel Stop",
            "Flying J Travel Center",
            "TA Travel Center",
            "Petro Stopping Center",
        ]
        
        import random
        stop_name = random.choice(truck_stops)
        
        display_name = location.get('display_name', '')
        if display_name:
            # Extract state from display name
            parts = display_name.split(',')
            if len(parts) >= 2:
                state = parts[-2].strip() if len(parts) > 2 else parts[-1].strip()
                return f"{stop_name}, {state}"
        
        return f"{stop_name}, Interstate Highway"


# Singleton instance
hos_calculator = HOSCalculator()
