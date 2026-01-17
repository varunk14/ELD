# HOS Rules (FMCSA Property-Carrying Driver, 70hr/8day)
HOS = {
    'DRIVING_LIMIT': 11,              # hours
    'ON_DUTY_WINDOW': 14,             # hours
    'BREAK_REQUIRED_AFTER': 8,        # hours of driving
    'BREAK_DURATION': 0.5,            # hours (30 minutes)
    'OFF_DUTY_REQUIRED': 10,          # hours
    'CYCLE_LIMIT': 70,                # hours
    'CYCLE_DAYS': 8,                  # days
    'RESTART_DURATION': 34,           # hours
}

# Activity Durations
ACTIVITY = {
    'PRE_TRIP': 0.5,                  # hours (30 minutes)
    'POST_TRIP': 0.5,                 # hours (30 minutes)
    'PICKUP': 1.0,                    # hours
    'DROPOFF': 1.0,                   # hours
    'FUELING': 0.5,                   # hours (30 minutes)
}

# Other Constants
FUEL_INTERVAL_MILES = 1000            # miles between fuel stops

# Duty Status
class DutyStatus:
    OFF_DUTY = 'off_duty'
    SLEEPER = 'sleeper_berth'
    DRIVING = 'driving'
    ON_DUTY = 'on_duty'

# Stop Types
class StopType:
    START = 'start'
    PICKUP = 'pickup'
    DROPOFF = 'dropoff'
    FUEL = 'fuel'
    REST_30MIN = 'rest_30min'
    REST_10HR = 'rest_10hr'
    REST_34HR = 'rest_34hr'
