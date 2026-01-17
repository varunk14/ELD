# ELD Trip Planner
## Product Requirements Document

**Version**: 2.0
**Last Updated**: January 17, 2026
**Status**: Ready for Development

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem & Solution](#2-problem--solution)
3. [User Requirements](#3-user-requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [Tech Stack & Dependencies](#5-tech-stack--dependencies)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [HOS Rules Engine](#8-hos-rules-engine)
9. [UI/UX Specifications](#9-uiux-specifications)
10. [Responsive Design](#10-responsive-design)
11. [Security & Performance](#11-security--performance)
12. [MVP Development Phases](#12-mvp-development-phases)
13. [Deployment Guide](#13-deployment-guide)
14. [Appendices](#14-appendices)

---

# 1. Executive Summary

## 1.1 What We're Building

A web application that helps truck drivers plan trips while automatically generating HOS-compliant log sheets.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Current    │ │   Pickup    │ │   Dropoff   │ │  Cycle    │ │
│  │  Location   │ │   Location  │ │   Location  │ │  Hours    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APP OUTPUT                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │      ROUTE MAP          │  │      ELD LOG SHEETS         │  │
│  │  • Route visualization  │  │  • Visual daily logs        │  │
│  │  • Stop markers         │  │  • Duty status lines        │  │
│  │  • Distance & time      │  │  • Remarks section          │  │
│  │  • Real truck stops     │  │  • PDF export               │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Features

| Feature | Description |
|---------|-------------|
| Route Planning | Calculate optimal route with real driving times |
| HOS Compliance | Auto-calculate breaks, rest periods per FMCSA rules |
| Real Truck Stops | Suggest Pilot, Flying J, Love's, rest areas |
| Visual Log Sheets | Draw DOT-compliant daily logs |
| PDF Export | Download logs for records |
| Trip History | Save and retrieve past trips |

## 1.3 Deliverables Checklist

- [ ] Live app on Vercel (frontend) + Railway (backend)
- [ ] 3-5 minute Loom video walkthrough
- [ ] GitHub repository with clean code
- [ ] Accurate HOS calculations
- [ ] Professional, responsive UI (mobile + desktop)

---

# 2. Problem & Solution

## 2.1 The Problem

| Pain Point | Impact |
|------------|--------|
| Manual hour calculations | Time-consuming, error-prone |
| Complex HOS rules | Multiple interacting limits confuse drivers |
| Compliance violations | Fines up to $16,000 per violation |
| Manual log drawing | Tedious, often incorrect |
| Trip planning difficulty | Hard to optimize while staying compliant |

## 2.2 Our Solution

| Solution | Benefit |
|----------|---------|
| Automated HOS calculation | 100% accurate compliance |
| Visual route planning | See entire trip with stops |
| Real truck stop suggestions | Know exactly where to stop |
| Auto-generated log sheets | No manual drawing needed |
| PDF export | Documentation ready instantly |

---

# 3. User Requirements

## 3.1 Input Fields

| Field | Type | Validation | Example |
|-------|------|------------|---------|
| Current Location | Text + Autocomplete | Required, valid address | "Green Bay, WI" |
| Pickup Location | Text + Autocomplete | Required, valid address | "Chicago, IL" |
| Dropoff Location | Text + Autocomplete | Required, valid address | "Dallas, TX" |
| Current Cycle Hours | Number (0-70) | Required, 0 ≤ x ≤ 70 | 25 |

## 3.2 Output Requirements

### Route Map
- [ ] Interactive map (zoom, pan, click)
- [ ] Route polyline from start → pickup → dropoff
- [ ] Markers for all stops with different icons
- [ ] Click markers to see details
- [ ] Total distance and time displayed

### Log Sheets
- [ ] Visual 24-hour grid matching DOT format
- [ ] 4 duty status rows with drawn lines
- [ ] All form fields populated
- [ ] Remarks section with activities
- [ ] Hours totaled correctly (= 24)
- [ ] Navigate between days
- [ ] Download as PDF

## 3.3 User Stories

```
AS A truck driver
I WANT TO enter my trip details
SO THAT I can see my route and get compliant log sheets

AS A truck driver
I WANT TO see real truck stops for breaks
SO THAT I know exactly where to stop

AS A truck driver
I WANT TO download my logs as PDF
SO THAT I have documentation for inspections

AS A truck driver
I WANT TO save my trips
SO THAT I can reference them later
```

---

# 4. Technical Architecture

## 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│   │   Browser    │  HTTPS  │    Vercel    │   API   │   Railway    │   │
│   │   (Client)   │◄───────►│   (React)    │◄───────►│   (Django)   │   │
│   └──────────────┘         └──────────────┘         └──────────────┘   │
│                                                            │            │
│                                                            ▼            │
│                                                     ┌──────────────┐   │
│                                                     │  PostgreSQL  │   │
│                                                     │  (Railway)   │   │
│                                                     └──────────────┘   │
│                                                                          │
│   External APIs:                                                         │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐             │
│   │ OpenRoute      │ │   Nominatim    │ │  Overpass API  │             │
│   │ Service        │ │   (Geocoding)  │ │  (Truck Stops) │             │
│   │ (Routing)      │ │                │ │                │             │
│   └────────────────┘ └────────────────┘ └────────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Data Flow

```
1. User enters trip details
          ▼
2. Frontend validates input
          ▼
3. POST /api/trips/calculate/
          ▼
4. Backend geocodes addresses (Nominatim)
          ▼
5. Backend calculates route (OpenRouteService)
          ▼
6. Backend applies HOS rules
          ▼
7. Backend finds truck stops (Overpass API)
          ▼
8. Backend generates daily logs
          ▼
9. Returns: route + stops + logs
          ▼
10. Frontend displays map + log sheets
          ▼
11. User can save trip or export PDF
```

## 4.3 Project Structure

```
eld-trip-planner/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile                    # Railway deployment
│   ├── runtime.txt                 # Python version
│   │
│   ├── config/                     # Project configuration
│   │   ├── __init__.py
│   │   ├── settings.py             # Django settings
│   │   ├── urls.py                 # Root URL config
│   │   └── wsgi.py                 # WSGI entry point
│   │
│   ├── users/                      # User authentication app
│   │   ├── __init__.py
│   │   ├── models.py               # Custom User model
│   │   ├── serializers.py          # User serializers
│   │   ├── views.py                # Auth views
│   │   ├── urls.py                 # Auth URLs
│   │   └── admin.py
│   │
│   └── trips/                      # Trip planning app
│       ├── __init__.py
│       ├── models.py               # Trip, Stop, Log models
│       ├── serializers.py          # Trip serializers
│       ├── views.py                # Trip views
│       ├── urls.py                 # Trip URLs
│       ├── admin.py
│       ├── constants.py            # HOS constants
│       │
│       └── services/               # Business logic
│           ├── __init__.py
│           ├── geocoding.py        # Nominatim integration
│           ├── routing.py          # OpenRouteService integration
│           ├── truck_stops.py      # Overpass API integration
│           ├── hos_calculator.py   # HOS rules engine
│           └── log_generator.py    # Log sheet data generation
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── vercel.json                 # Vercel deployment
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── main.jsx                # Entry point
│       ├── App.jsx                 # Root component
│       │
│       ├── components/
│       │   ├── common/             # Reusable components
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Loading.jsx
│       │   │   └── ErrorMessage.jsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Layout.jsx
│       │   │   └── MobileNav.jsx
│       │   │
│       │   ├── auth/
│       │   │   ├── LoginForm.jsx
│       │   │   └── RegisterForm.jsx
│       │   │
│       │   ├── trip/
│       │   │   ├── TripForm.jsx
│       │   │   ├── LocationInput.jsx
│       │   │   ├── TripSummary.jsx
│       │   │   └── StopsList.jsx
│       │   │
│       │   ├── map/
│       │   │   ├── TripMap.jsx
│       │   │   ├── RouteLayer.jsx
│       │   │   └── StopMarker.jsx
│       │   │
│       │   └── log/
│       │       ├── LogSheet.jsx
│       │       ├── LogGrid.jsx
│       │       ├── DutyStatusLine.jsx
│       │       ├── RemarksSection.jsx
│       │       └── LogNavigation.jsx
│       │
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── TripPlanner.jsx
│       │   ├── TripHistory.jsx
│       │   └── TripDetail.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useTrip.js
│       │
│       ├── services/
│       │   └── api.js              # Axios instance
│       │
│       ├── constants/
│       │   ├── hos.js              # HOS constants
│       │   └── mapIcons.js         # Marker icons
│       │
│       └── utils/
│           ├── formatTime.js
│           ├── formatDistance.js
│           └── pdfExport.js
│
├── PROJECT_MEMORY.md
├── PRD.md
└── .cursorrules
```

---

# 5. Tech Stack & Dependencies

## 5.1 Backend

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| Python | 3.12.x | Runtime |
| Django | 5.1.4 | Web framework |
| djangorestframework | 3.15.2 | REST API |
| djangorestframework-simplejwt | 5.3.1 | JWT authentication |

### Database & ORM
| Package | Version | Purpose |
|---------|---------|---------|
| psycopg2-binary | 2.9.9 | PostgreSQL adapter |
| dj-database-url | 2.1.0 | Database URL parsing |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| django-cors-headers | 4.3.1 | CORS handling |
| python-decouple | 3.8 | Environment variables |
| requests | 2.31.0 | HTTP client for APIs |
| gunicorn | 21.2.0 | Production server |
| whitenoise | 6.6.0 | Static files |

### requirements.txt
```txt
Django==5.1.4
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
dj-database-url==2.1.0
python-decouple==3.8
requests==2.31.0
gunicorn==21.2.0
whitenoise==6.6.0
```

## 5.2 Frontend

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 5.4.x | Build tool |
| React Router | 6.22.x | Routing |

### Styling
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 3.4.x | Utility CSS |
| PostCSS | 8.4.x | CSS processing |
| Autoprefixer | 10.4.x | CSS vendor prefixes |

### Map & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| Leaflet | 1.9.4 | Map library |
| react-leaflet | 4.2.1 | React wrapper |

### HTTP & State
| Package | Version | Purpose |
|---------|---------|---------|
| Axios | 1.6.7 | HTTP client |

### PDF Export
| Package | Version | Purpose |
|---------|---------|---------|
| jsPDF | 2.5.1 | PDF generation |
| html2canvas | 1.4.1 | HTML to canvas |

### package.json dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

## 5.3 External APIs

| API | Base URL | Purpose | Rate Limit |
|-----|----------|---------|------------|
| OpenRouteService | `https://api.openrouteservice.org` | Routing, directions | 2,000/day |
| Nominatim | `https://nominatim.openstreetmap.org` | Geocoding | 1 req/sec |
| Overpass API | `https://overpass-api.de/api` | Truck stops query | Unlimited |
| OSM Tiles | `https://{s}.tile.openstreetmap.org` | Map tiles | Unlimited |

### API Documentation Links
- OpenRouteService: https://openrouteservice.org/dev/#/api-docs/v2/directions
- Nominatim: https://nominatim.org/release-docs/latest/api/Search/
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API

## 5.4 Development Tools

| Tool | Purpose |
|------|---------|
| VS Code / Cursor | IDE |
| Postman | API testing |
| Chrome DevTools | Debugging, responsive testing |
| Git | Version control |

---

# 6. API Reference

## 6.1 Authentication

### Register
```http
POST /api/auth/register/
Content-Type: application/json

Request:
{
  "email": "driver@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "company_name": "ABC Trucking",        // optional
  "truck_number": "1234",                 // optional
  "home_terminal": "Green Bay, WI"        // optional
}

Response 201:
{
  "user": {
    "id": "uuid",
    "email": "driver@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}

Response 400:
{
  "error": "Validation failed",
  "details": {
    "email": ["Email already exists"],
    "password": ["Must be at least 8 characters"]
  }
}
```

### Login
```http
POST /api/auth/login/
Content-Type: application/json

Request:
{
  "email": "driver@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "driver@example.com",
    "name": "John Doe"
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}

Response 401:
{
  "error": "Invalid credentials"
}
```

### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

Request:
{
  "refresh": "eyJ..."
}

Response 200:
{
  "access": "eyJ..."
}
```

### Logout
```http
POST /api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "refresh": "eyJ..."
}

Response 200:
{
  "message": "Successfully logged out"
}
```

## 6.2 Trips

### Calculate Trip
```http
POST /api/trips/calculate/
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "current_location": "Green Bay, WI",
  "pickup_location": "Chicago, IL",
  "dropoff_location": "Dallas, TX",
  "current_cycle_hours": 25,
  "start_time": "2026-01-17T06:30:00Z"    // optional, defaults to now
}

Response 200:
{
  "trip_id": "uuid",
  "summary": {
    "total_distance_miles": 1130,
    "total_driving_hours": 20.5,
    "total_days": 3,
    "total_stops": 8
  },
  "route": {
    "polyline": "encoded_polyline_string",
    "segments": [
      {
        "from": "Green Bay, WI",
        "to": "Chicago, IL",
        "distance_miles": 210,
        "duration_hours": 3.8
      },
      {
        "from": "Chicago, IL",
        "to": "Dallas, TX",
        "distance_miles": 920,
        "duration_hours": 16.7
      }
    ]
  },
  "stops": [
    {
      "order": 1,
      "type": "start",
      "name": "Starting Location",
      "address": "Green Bay, WI",
      "coordinates": { "lat": 44.5133, "lng": -88.0133 },
      "arrival": "2026-01-17T06:30:00Z",
      "departure": "2026-01-17T07:00:00Z",
      "duration_minutes": 30,
      "activity": "Pre-trip inspection"
    },
    {
      "order": 2,
      "type": "pickup",
      "name": "Pickup Location",
      "address": "Chicago, IL",
      "coordinates": { "lat": 41.8781, "lng": -87.6298 },
      "arrival": "2026-01-17T10:48:00Z",
      "departure": "2026-01-17T11:48:00Z",
      "duration_minutes": 60,
      "activity": "Loading"
    },
    {
      "order": 3,
      "type": "rest_30min",
      "name": "Pilot Travel Center",
      "address": "1234 Highway 55, Bloomington, IL",
      "coordinates": { "lat": 40.4842, "lng": -88.9937 },
      "arrival": "2026-01-17T15:18:00Z",
      "departure": "2026-01-17T15:48:00Z",
      "duration_minutes": 30,
      "activity": "30-minute break"
    }
    // ... more stops
  ],
  "daily_logs": [
    {
      "day": 1,
      "date": "2026-01-17",
      "start_location": "Green Bay, WI",
      "end_location": "Springfield, IL",
      "total_miles": 472,
      "hours": {
        "off_duty": 8.5,
        "sleeper_berth": 5.0,
        "driving": 9.5,
        "on_duty": 1.0
      },
      "entries": [
        {
          "status": "off_duty",
          "start": "00:00",
          "end": "06:30",
          "location": "Green Bay, WI",
          "activity": null
        },
        {
          "status": "on_duty",
          "start": "06:30",
          "end": "07:00",
          "location": "Green Bay, WI",
          "activity": "Pre-trip inspection"
        },
        {
          "status": "driving",
          "start": "07:00",
          "end": "10:48",
          "location": "Green Bay, WI → Chicago, IL",
          "activity": null
        }
        // ... more entries
      ],
      "remarks": [
        { "time": "06:30", "location": "Green Bay, WI", "activity": "Pre-trip inspection, TI" },
        { "time": "07:00", "location": "Green Bay, WI", "activity": "Depart" },
        { "time": "10:48", "location": "Chicago, IL", "activity": "Arrive pickup" }
        // ... more remarks
      ]
    }
    // ... more days
  ]
}
```

### Save Trip
```http
POST /api/trips/
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "trip_id": "uuid"  // from calculate response
}

Response 201:
{
  "message": "Trip saved successfully",
  "trip_id": "uuid"
}
```

### List Trips
```http
GET /api/trips/
Authorization: Bearer <access_token>

Response 200:
{
  "trips": [
    {
      "id": "uuid",
      "current_location": "Green Bay, WI",
      "pickup_location": "Chicago, IL",
      "dropoff_location": "Dallas, TX",
      "total_distance_miles": 1130,
      "total_days": 3,
      "created_at": "2026-01-17T06:30:00Z"
    }
  ]
}
```

### Get Trip Detail
```http
GET /api/trips/{trip_id}/
Authorization: Bearer <access_token>

Response 200:
{
  // Full trip object (same as calculate response)
}
```

### Delete Trip
```http
DELETE /api/trips/{trip_id}/
Authorization: Bearer <access_token>

Response 204: (no content)
```

## 6.3 Utilities

### Geocode Address
```http
GET /api/geocode/?address=Chicago,IL

Response 200:
{
  "results": [
    {
      "display_name": "Chicago, Cook County, Illinois, USA",
      "lat": 41.8781,
      "lng": -87.6298
    }
  ]
}
```

### Find Truck Stops
```http
GET /api/truck-stops/?lat=41.87&lng=-87.62&radius=50

Response 200:
{
  "stops": [
    {
      "name": "Pilot Travel Center",
      "address": "1234 Highway Rd, City, IL",
      "lat": 41.85,
      "lng": -87.65,
      "amenities": ["fuel", "parking", "food"]
    }
  ]
}
```

## 6.4 Error Response Format

All errors follow this format:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { }  // optional, for validation errors
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

# 7. Database Schema

## 7.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │     Trip     │       │   TripStop   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──────<│ id (PK)      │──────<│ id (PK)      │
│ email        │       │ user_id (FK) │       │ trip_id (FK) │
│ password     │       │ current_loc  │       │ order        │
│ name         │       │ pickup_loc   │       │ stop_type    │
│ company_name │       │ dropoff_loc  │       │ name         │
│ truck_number │       │ cycle_hours  │       │ address      │
│ home_terminal│       │ total_miles  │       │ lat, lng     │
│ created_at   │       │ total_hours  │       │ arrival      │
└──────────────┘       │ total_days   │       │ departure    │
                       │ route_data   │       │ duration     │
                       │ created_at   │       │ activity     │
                       └──────────────┘       └──────────────┘
                              │
                              │
                       ┌──────────────┐       ┌──────────────┐
                       │   DailyLog   │       │   LogEntry   │
                       ├──────────────┤       ├──────────────┤
                       │ id (PK)      │──────<│ id (PK)      │
                       │ trip_id (FK) │       │ log_id (FK)  │
                       │ day_number   │       │ order        │
                       │ log_date     │       │ status       │
                       │ total_miles  │       │ start_time   │
                       │ off_duty_hrs │       │ end_time     │
                       │ sleeper_hrs  │       │ location     │
                       │ driving_hrs  │       │ activity     │
                       │ on_duty_hrs  │       └──────────────┘
                       │ remarks_json │
                       └──────────────┘
```

## 7.2 Django Models

### users/models.py
```python
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True)
    truck_number = models.CharField(max_length=50, blank=True)
    trailer_number = models.CharField(max_length=50, blank=True)
    home_terminal = models.CharField(max_length=255, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email
```

### trips/models.py
```python
import uuid
from django.db import models
from django.conf import settings


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips'
    )

    # Locations
    current_location = models.CharField(max_length=255)
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    current_location_lng = models.DecimalField(max_digits=9, decimal_places=6)

    pickup_location = models.CharField(max_length=255)
    pickup_location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    pickup_location_lng = models.DecimalField(max_digits=9, decimal_places=6)

    dropoff_location = models.CharField(max_length=255)
    dropoff_location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    dropoff_location_lng = models.DecimalField(max_digits=9, decimal_places=6)

    # Trip details
    current_cycle_hours = models.DecimalField(max_digits=4, decimal_places=2)
    total_distance_miles = models.DecimalField(max_digits=8, decimal_places=2)
    total_driving_hours = models.DecimalField(max_digits=6, decimal_places=2)
    total_days = models.IntegerField()

    # Route data (encoded polyline)
    route_polyline = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.current_location} → {self.dropoff_location}"


class TripStop(models.Model):
    STOP_TYPES = [
        ('start', 'Start'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('fuel', 'Fuel'),
        ('rest_30min', '30-Minute Break'),
        ('rest_10hr', '10-Hour Rest'),
        ('rest_34hr', '34-Hour Restart'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')

    order = models.IntegerField()
    stop_type = models.CharField(max_length=20, choices=STOP_TYPES)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    activity = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.order}. {self.stop_type} - {self.name}"


class DailyLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='daily_logs')

    day_number = models.IntegerField()
    log_date = models.DateField()

    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    total_miles = models.DecimalField(max_digits=8, decimal_places=2)

    off_duty_hours = models.DecimalField(max_digits=4, decimal_places=2)
    sleeper_berth_hours = models.DecimalField(max_digits=4, decimal_places=2)
    driving_hours = models.DecimalField(max_digits=4, decimal_places=2)
    on_duty_hours = models.DecimalField(max_digits=4, decimal_places=2)

    remarks = models.JSONField(default=list)  # [{time, location, activity}]

    class Meta:
        ordering = ['day_number']

    def __str__(self):
        return f"Day {self.day_number} - {self.log_date}"


class LogEntry(models.Model):
    DUTY_STATUS = [
        ('off_duty', 'Off Duty'),
        ('sleeper_berth', 'Sleeper Berth'),
        ('driving', 'Driving'),
        ('on_duty', 'On Duty'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='entries')

    order = models.IntegerField()
    duty_status = models.CharField(max_length=20, choices=DUTY_STATUS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    activity = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.start_time}-{self.end_time}: {self.duty_status}"
```

---

# 8. HOS Rules Engine

## 8.1 FMCSA Rules Reference

### Property-Carrying Driver (70hr/8day)

| Rule | Limit | Description |
|------|-------|-------------|
| **11-Hour Driving** | 11 hours | Max driving after 10 consecutive hours off |
| **14-Hour Window** | 14 hours | On-duty window cannot extend beyond 14 hours |
| **30-Minute Break** | Required | Must take 30-min break after 8 hours driving |
| **10-Hour Off-Duty** | 10 hours | Must have 10 consecutive hours off before driving |
| **70-Hour Cycle** | 70 hours | Cannot drive after 70 on-duty hours in 8 days |
| **34-Hour Restart** | 34 hours | Resets 70-hour clock to zero |

## 8.2 Constants

### trips/constants.py
```python
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
```

## 8.3 Algorithm

```python
def calculate_trip_with_hos(
    current_location,      # (lat, lng, address)
    pickup_location,       # (lat, lng, address)
    dropoff_location,      # (lat, lng, address)
    current_cycle_hours,   # 0-70
    start_time             # datetime
):
    """
    Main algorithm for calculating a trip with HOS compliance.

    Returns:
        - stops: List of all stops with times
        - daily_logs: List of daily log data
    """

    # Initialize tracking variables
    state = {
        'current_time': start_time,
        'drive_hours_today': 0,
        'on_duty_hours_today': 0,
        'drive_since_break': 0,
        'cycle_hours_remaining': 70 - current_cycle_hours,
        'miles_since_fuel': 0,
        'current_day': 1,
        'current_location': current_location,
    }

    stops = []

    # 1. Add pre-trip inspection
    stops.append(create_stop(
        type='start',
        location=current_location,
        duration=0.5,  # 30 min
        activity='Pre-trip inspection'
    ))
    state['on_duty_hours_today'] += 0.5
    state['current_time'] += timedelta(hours=0.5)

    # 2. Get route segments
    route_to_pickup = get_route(current_location, pickup_location)
    route_to_dropoff = get_route(pickup_location, dropoff_location)

    # 3. Process drive to pickup
    process_driving_segment(state, stops, route_to_pickup)

    # 4. Add pickup stop
    stops.append(create_stop(
        type='pickup',
        location=pickup_location,
        duration=1.0,  # 1 hour
        activity='Loading'
    ))
    state['on_duty_hours_today'] += 1.0
    state['current_time'] += timedelta(hours=1.0)

    # 5. Process drive to dropoff
    process_driving_segment(state, stops, route_to_dropoff)

    # 6. Add dropoff stop
    stops.append(create_stop(
        type='dropoff',
        location=dropoff_location,
        duration=1.0,  # 1 hour
        activity='Unloading'
    ))

    # 7. Add post-trip inspection
    stops.append(create_stop(
        type='end',
        location=dropoff_location,
        duration=0.5,  # 30 min
        activity='Post-trip inspection'
    ))

    # 8. Generate daily logs from stops
    daily_logs = generate_daily_logs(stops)

    return stops, daily_logs


def process_driving_segment(state, stops, route):
    """
    Process a driving segment, adding stops as needed for HOS compliance.
    """
    remaining_miles = route['distance_miles']
    remaining_hours = route['duration_hours']

    while remaining_hours > 0:
        # Calculate available driving time
        available_drive = min(
            HOS['DRIVING_LIMIT'] - state['drive_hours_today'],
            HOS['ON_DUTY_WINDOW'] - state['on_duty_hours_today'],
            HOS['BREAK_REQUIRED_AFTER'] - state['drive_since_break'],
            state['cycle_hours_remaining']
        )

        # Check if we need a stop
        if available_drive <= 0:
            # Determine which limit was hit
            if state['cycle_hours_remaining'] <= 0:
                # Need 34-hour restart
                add_rest_stop(state, stops, StopType.REST_34HR, 34)
                state['cycle_hours_remaining'] = 70
            elif state['drive_hours_today'] >= HOS['DRIVING_LIMIT'] or \
                 state['on_duty_hours_today'] >= HOS['ON_DUTY_WINDOW']:
                # Need 10-hour rest
                add_rest_stop(state, stops, StopType.REST_10HR, 10)
                state['drive_hours_today'] = 0
                state['on_duty_hours_today'] = 0
                state['drive_since_break'] = 0
                state['current_day'] += 1
                # Add pre-trip for new day
                add_pre_trip(state, stops)
            elif state['drive_since_break'] >= HOS['BREAK_REQUIRED_AFTER']:
                # Need 30-minute break
                add_rest_stop(state, stops, StopType.REST_30MIN, 0.5)
                state['drive_since_break'] = 0

            continue

        # Check fuel
        if state['miles_since_fuel'] >= FUEL_INTERVAL_MILES:
            add_fuel_stop(state, stops)
            state['miles_since_fuel'] = 0

        # Drive for available time
        drive_time = min(available_drive, remaining_hours)
        drive_miles = (drive_time / remaining_hours) * remaining_miles

        # Update state
        state['drive_hours_today'] += drive_time
        state['on_duty_hours_today'] += drive_time
        state['drive_since_break'] += drive_time
        state['cycle_hours_remaining'] -= drive_time
        state['miles_since_fuel'] += drive_miles
        state['current_time'] += timedelta(hours=drive_time)

        remaining_hours -= drive_time
        remaining_miles -= drive_miles


def add_rest_stop(state, stops, stop_type, duration):
    """Add a rest stop and find nearest truck stop."""
    truck_stop = find_nearest_truck_stop(state['current_location'])

    stops.append(create_stop(
        type=stop_type,
        location=truck_stop,
        duration=duration,
        activity=get_activity_description(stop_type)
    ))

    state['current_time'] += timedelta(hours=duration)
```

## 8.4 Edge Cases

| Scenario | Handling |
|----------|----------|
| Trip completes in < 11 hours | Single day, no overnight rest |
| 30-min break at end of day | Counts toward 10-hour off-duty |
| Cycle hours = 70 at start | Immediate 34-hour restart |
| Pickup = current location | Skip first driving segment |
| Break + fuel at same point | Combine into single stop |
| Very short trip (< 1 hour) | Still include pre/post trip |

---

# 9. UI/UX Specifications

## 9.1 Design System

### Colors (Tailwind)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      }
    }
  }
}
```

### Typography
| Element | Class | Example |
|---------|-------|---------|
| H1 | `text-3xl font-bold` | Page titles |
| H2 | `text-2xl font-semibold` | Section headers |
| H3 | `text-xl font-semibold` | Card headers |
| Body | `text-base` | Main content |
| Small | `text-sm text-gray-600` | Helper text |

### Spacing
- Container padding: `p-4 md:p-6 lg:p-8`
- Card padding: `p-4 md:p-6`
- Element spacing: `space-y-4`
- Grid gaps: `gap-4 md:gap-6`

## 9.2 Component Specifications

### Button
```jsx
// Primary
<button className="w-full md:w-auto px-6 py-3 min-h-[44px] bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Calculate Trip
</button>

// Secondary
<button className="w-full md:w-auto px-6 py-3 min-h-[44px] border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
  Cancel
</button>
```

### Input
```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Current Location
  </label>
  <input
    type="text"
    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
    placeholder="Enter city or address"
  />
  <p className="text-sm text-red-600">Error message here</p>
</div>
```

### Card
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
  {/* Content */}
</div>
```

## 9.3 Page Layouts

### Trip Planner Page
```
Mobile (< 640px):
┌────────────────────┐
│      Header        │
├────────────────────┤
│                    │
│    Trip Form       │
│    (full width)    │
│                    │
├────────────────────┤
│                    │
│    Map             │
│    (full width)    │
│                    │
├────────────────────┤
│   Trip Summary     │
├────────────────────┤
│   Stops List       │
│   (collapsible)    │
└────────────────────┘

Desktop (≥ 1024px):
┌─────────────────────────────────────────────┐
│                   Header                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │             │  │                     │  │
│  │  Trip Form  │  │        Map          │  │
│  │   (30%)     │  │       (70%)         │  │
│  │             │  │                     │  │
│  │─────────────│  │                     │  │
│  │ Trip Summary│  │                     │  │
│  │─────────────│  │                     │  │
│  │ Stops List  │  │                     │  │
│  │             │  │                     │  │
│  └─────────────┘  └─────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### Log Sheet View
```
Mobile:
┌────────────────────┐
│      Header        │
├────────────────────┤
│ [Day 1][Day 2][3]  │
├────────────────────┤
│ ┌────────────────┐ │
│ │                │ │
│ │   Log Sheet    │ │
│ │  (scrollable)  │ │
│ │                │ │
│ └────────────────┘ │
├────────────────────┤
│ [Download PDF]     │
└────────────────────┘

Desktop:
┌─────────────────────────────────────────────┐
│                   Header                     │
├─────────────────────────────────────────────┤
│                                             │
│  [Day 1] [Day 2] [Day 3]    [Export All]   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │          Driver's Daily Log         │   │
│  │                                     │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │    24-hour grid with        │   │   │
│  │  │    duty status lines        │   │   │
│  │  └─────────────────────────────┘   │   │
│  │                                     │   │
│  │  Remarks: ________________________  │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [← Previous]              [Next →]         │
│  [Download This Day as PDF]                 │
│                                             │
└─────────────────────────────────────────────┘
```

## 9.4 Map Markers

| Type | Icon | Color (Hex) | Tailwind |
|------|------|-------------|----------|
| Start | Circle | #3B82F6 | blue-500 |
| Pickup | Package | #22C55E | green-500 |
| Dropoff | Flag | #EF4444 | red-500 |
| Fuel | Gas Pump | #F97316 | orange-500 |
| 30-min Break | Coffee | #EAB308 | yellow-500 |
| 10-hr Rest | Bed | #8B5CF6 | purple-500 |
| 34-hr Restart | Moon | #1E40AF | blue-800 |

---

# 10. Responsive Design

## 10.1 Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large monitors */
```

## 10.2 Mobile-First Approach

**CRITICAL**: Always design mobile-first.

```jsx
// ✅ CORRECT: Mobile-first
<div className="flex flex-col lg:flex-row">
<div className="w-full lg:w-1/3">
<div className="p-4 md:p-6 lg:p-8">

// ❌ WRONG: Desktop-first
<div className="flex flex-row lg:flex-col">
```

## 10.3 Touch Requirements

| Requirement | Minimum | Implementation |
|-------------|---------|----------------|
| Tap target | 44×44px | `min-h-[44px] min-w-[44px]` |
| Input font | 16px | `text-base` (prevents iOS zoom) |
| Touch spacing | 8px | `gap-2` or `space-y-2` |

## 10.4 Component Responsive Behavior

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Navigation | Hamburger menu | Full nav | Full nav |
| Trip Form | Full width, stacked | 40% width | 30% width |
| Map | Full width below form | 60% width | 70% width |
| Stops List | Accordion | Scrollable | Full list |
| Log Sheet | Horizontal scroll | Fit with scroll | Full size |
| Buttons | Full width, stacked | Auto width | Auto width |
| Modals | Full screen | 80% width | Max 600px |

## 10.5 Testing Checklist

Test on these widths:
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13/14)
- [ ] 428px (iPhone 14 Pro Max)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro, small laptop)
- [ ] 1280px (Desktop)
- [ ] 1920px (Full HD monitor)

---

# 11. Security & Performance

## 11.1 Security Requirements

### Authentication
- [x] JWT tokens with short expiry (15 min access, 7 day refresh)
- [x] Passwords hashed with Django's PBKDF2
- [x] Refresh token rotation on use
- [x] Token blacklisting on logout

### Data Protection
- [x] HTTPS only (enforced by Vercel/Railway)
- [x] CORS restricted to frontend domain
- [x] Input validation on all endpoints
- [x] SQL injection prevented by Django ORM
- [x] XSS prevented by React's default escaping

### API Security
- [x] Rate limiting on auth endpoints
- [x] Request size limits
- [x] No sensitive data in URLs
- [x] No secrets in client code

## 11.2 Environment Variables

### Backend (.env)
```bash
# Django
DEBUG=False
SECRET_KEY=your-super-secret-key-min-50-chars
ALLOWED_HOSTS=your-app.up.railway.app

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# CORS
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# External APIs
ORS_API_KEY=your-openrouteservice-key
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-app.up.railway.app/api
```

**IMPORTANT**: Never commit .env files!

## 11.3 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| API Response Time | < 500ms (p95) |
| Trip Calculation | < 5s |

## 11.4 Performance Optimizations

### Backend
- Cache geocoding results
- Use database indexes
- Paginate list endpoints
- Minimize external API calls

### Frontend
- Lazy load routes
- Optimize images
- Minimize bundle size
- Use React.memo where appropriate

---

# 12. MVP Development Phases

## MVP 1: Foundation

### Goal
Basic infrastructure with working authentication.

### Backend Tasks
```
□ django-admin startproject config .
□ Create users app
□ Custom User model
□ JWT authentication setup
□ Register/Login/Logout endpoints
□ CORS configuration
□ Deploy to Railway
```

### Frontend Tasks
```
□ npm create vite@latest
□ Install dependencies
□ Tailwind CSS setup
□ React Router setup
□ Auth context
□ Login/Register pages
□ Protected routes
□ Axios setup with interceptors
□ Deploy to Vercel
```

### Testing Checklist

#### API Tests
| Test | Expected | ✓ |
|------|----------|---|
| POST /api/auth/register/ (valid) | 201, returns tokens | □ |
| POST /api/auth/register/ (duplicate email) | 400, error message | □ |
| POST /api/auth/login/ (valid) | 200, returns tokens | □ |
| POST /api/auth/login/ (wrong password) | 401 | □ |
| POST /api/auth/refresh/ (valid) | 200, new access token | □ |
| GET protected route (no token) | 401 | □ |
| GET protected route (valid token) | 200 | □ |

#### UI Tests
| Test | Expected | ✓ |
|------|----------|---|
| Register page loads | Form displays | □ |
| Register with valid data | Redirects to dashboard | □ |
| Login page loads | Form displays | □ |
| Login with valid credentials | Redirects to dashboard | □ |
| Refresh page while logged in | Stays logged in | □ |
| Logout | Redirects to login | □ |
| Access protected route (not logged in) | Redirects to login | □ |

#### Responsive Tests
| Test | ✓ |
|------|---|
| Login page on 375px | □ |
| Login page on 768px | □ |
| Login page on 1280px | □ |

---

## MVP 2: Route Planning

### Goal
Calculate and display routes on map.

### Backend Tasks
```
□ Create trips app
□ Geocoding service (Nominatim)
□ Routing service (OpenRouteService)
□ GET /api/geocode/ endpoint
□ POST /api/trips/calculate/ (basic route only)
```

### Frontend Tasks
```
□ TripForm component
□ LocationInput with autocomplete
□ Leaflet map integration
□ Route display on map
□ Markers for start/pickup/dropoff
□ Trip summary display
□ TripPlanner page
```

### Testing Checklist

#### API Tests
| Test | Expected | ✓ |
|------|----------|---|
| GET /api/geocode/?address=Chicago,IL | Returns coordinates | □ |
| GET /api/geocode/?address=invalid | Returns empty | □ |
| POST /api/trips/calculate/ (valid) | Returns route data | □ |
| Route distance accuracy | Within 10% of Google Maps | □ |
| Route duration accuracy | Within 15% of Google Maps | □ |

#### UI Tests
| Test | Expected | ✓ |
|------|----------|---|
| Map loads | Displays centered on US | □ |
| Autocomplete works | Suggestions appear | □ |
| Calculate trip | Route appears on map | □ |
| All markers display | 3 markers visible | □ |
| Click marker | Popup shows info | □ |
| Summary shows | Distance and time displayed | □ |

#### Responsive Tests
| Test | ✓ |
|------|---|
| Trip planner on 375px (form stacks above map) | □ |
| Trip planner on 768px | □ |
| Trip planner on 1280px (side by side) | □ |
| Map touch/pinch zoom on mobile | □ |

---

## MVP 3: HOS Engine

### Goal
Calculate all required stops based on HOS rules.

### Backend Tasks
```
□ Create constants.py with HOS rules
□ Implement hos_calculator.py service
□ 11-hour driving limit logic
□ 14-hour window logic
□ 30-minute break logic
□ 10-hour rest logic
□ 70-hour cycle logic
□ 34-hour restart logic
□ Include pickup/dropoff time
□ Include pre/post trip inspections
□ Update calculate endpoint
```

### Frontend Tasks
```
□ Cycle hours input field
□ Stops list component
□ Stop type icons
□ Stop markers on map
□ Different marker colors
□ Trip timeline display
```

### Testing Checklist

#### HOS Logic Tests
| Test | Expected | ✓ |
|------|----------|---|
| Trip < 11 hours driving | No 10-hr rest mid-trip | □ |
| Trip > 11 hours driving | 10-hr rest inserted | □ |
| 8+ hours driving | 30-min break inserted | □ |
| Trip exhausts 14-hr window | 10-hr rest inserted | □ |
| Cycle hours = 65, 10-hr trip | 34-hr restart triggered | □ |
| Pre-trip inspection | 30 min at start of each day | □ |
| Pickup duration | 1 hour on-duty | □ |
| Dropoff duration | 1 hour on-duty | □ |

#### UI Tests
| Test | Expected | ✓ |
|------|----------|---|
| Cycle hours input displays | 0-70 range | □ |
| Stops list shows all stops | Correct order | □ |
| Each stop shows type, time, duration | Formatted correctly | □ |
| Map shows all stop markers | Different colors | □ |
| Total days calculation | Correct | □ |

---

## MVP 4: Truck Stops

### Goal
Find real truck stops for rest and fuel.

### Backend Tasks
```
□ Create truck_stops.py service
□ Overpass API integration
□ GET /api/truck-stops/ endpoint
□ Integrate into trip calculation
□ Fuel stops every 1000 miles
□ Combine rest + fuel when close
```

### Frontend Tasks
```
□ Truck stop names in stop list
□ Stop details on click
□ Marker icons per stop type
□ Combined stop labels
□ Improved stop list UI
```

### Testing Checklist

#### API Tests
| Test | Expected | ✓ |
|------|----------|---|
| GET /api/truck-stops/ (valid location) | Returns truck stops | □ |
| Results include real stops | Pilot, Love's, Flying J | □ |
| 500-mile trip | No fuel stop | □ |
| 1200-mile trip | 1+ fuel stops | □ |

#### UI Tests
| Test | Expected | ✓ |
|------|----------|---|
| Stop names shown | Real truck stop names | □ |
| Stop addresses shown | Full addresses | □ |
| Different marker icons | 7 different types | □ |
| Click marker | Shows stop details | □ |

---

## MVP 5: Log Sheet Generation

### Goal
Generate visual log sheets matching DOT format.

### Backend Tasks
```
□ Create log_generator.py service
□ Generate daily log data
□ Calculate hours per status
□ Generate remarks
□ Create DailyLog and LogEntry models
□ Return structured log data
```

### Frontend Tasks
```
□ LogSheet component (SVG or Canvas)
□ 24-hour grid drawing
□ Duty status line drawing
□ Vertical connection lines
□ Form field population
□ Remarks section
□ Hours totals
□ Day navigation
```

### Testing Checklist

#### Log Data Tests
| Test | Expected | ✓ |
|------|----------|---|
| Hours total | Equals 24 | □ |
| Off-duty hours | Correct sum | □ |
| Driving hours | Correct sum | □ |
| Remarks count | Matches status changes | □ |

#### Visual Tests
| Test | Expected | ✓ |
|------|----------|---|
| Grid displays | 24-hour format | □ |
| 4 rows visible | Off-duty, Sleeper, Driving, On-duty | □ |
| Lines drawn | Horizontal + vertical connections | □ |
| Date field | Correct date | □ |
| Miles field | Correct daily miles | □ |
| Remarks show | All activities listed | □ |
| Day navigation | Tabs work | □ |

#### Responsive Tests
| Test | ✓ |
|------|---|
| Log sheet on 375px (scrollable) | □ |
| Log sheet on 768px | □ |
| Log sheet on 1280px (full size) | □ |

---

## MVP 6: Export & Polish

### Goal
PDF export, persistence, and final polish.

### Backend Tasks
```
□ POST /api/trips/ (save)
□ GET /api/trips/ (list)
□ GET /api/trips/{id}/ (detail)
□ DELETE /api/trips/{id}/
□ Input validation improvements
□ Error handling improvements
```

### Frontend Tasks
```
□ PDF export (single day)
□ PDF export (all days)
□ Trip history page
□ Load saved trip
□ Delete trip
□ Loading states everywhere
□ Error handling UI
□ Responsive fixes
□ UI polish
```

### Testing Checklist

#### PDF Tests
| Test | Expected | ✓ |
|------|----------|---|
| Export single day | PDF downloads | □ |
| PDF opens | No errors | □ |
| PDF readable | Grid and lines visible | □ |
| Export all days | Multi-page PDF | □ |
| Print quality | Looks good printed | □ |

#### Persistence Tests
| Test | Expected | ✓ |
|------|----------|---|
| Save trip | Success message | □ |
| Trip in history | Appears in list | □ |
| Load saved trip | Full data restored | □ |
| Delete trip | Removed from list | □ |

#### Final Tests
| Test | Expected | ✓ |
|------|----------|---|
| Full flow (short trip) | Works end-to-end | □ |
| Full flow (long trip) | Works end-to-end | □ |
| All pages on 375px | Perfect layout | □ |
| All pages on 768px | Perfect layout | □ |
| All pages on 1280px | Perfect layout | □ |
| Chrome | Works | □ |
| Firefox | Works | □ |
| Safari | Works | □ |
| Real mobile device | Works perfectly | □ |

---

# 13. Deployment Guide

## 13.1 Backend (Railway)

### Step 1: Prepare Files

**Procfile**
```
web: gunicorn config.wsgi --log-file -
```

**runtime.txt**
```
python-3.12.0
```

### Step 2: Railway Setup

1. Create account at railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Add PostgreSQL database
5. Set environment variables:

```
SECRET_KEY=<generate-secure-key>
DEBUG=False
ALLOWED_HOSTS=<your-app>.up.railway.app
DATABASE_URL=<auto-filled-by-railway>
CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app
ORS_API_KEY=<your-key>
```

6. Deploy

### Step 3: Run Migrations

```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

## 13.2 Frontend (Vercel)

### Step 1: Prepare Files

**vercel.json**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Step 2: Vercel Setup

1. Create account at vercel.com
2. Import Git repository
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables:

```
VITE_API_URL=https://<your-railway-app>.up.railway.app/api
```

7. Deploy

## 13.3 Post-Deployment Checklist

- [ ] Backend URL accessible
- [ ] Frontend URL accessible
- [ ] Frontend connects to backend
- [ ] Register/Login works
- [ ] Trip calculation works
- [ ] HTTPS working
- [ ] CORS configured correctly
- [ ] Database persisting data

---

# 14. Appendices

## Appendix A: Setup Commands

### Backend
```bash
# Create project
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt
pip install django-cors-headers python-decouple requests psycopg2-binary
pip install gunicorn whitenoise dj-database-url

# Start project
django-admin startproject config .
python manage.py startapp users
python manage.py startapp trips

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver
```

### Frontend
```bash
# Create project
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install react-router-dom axios leaflet react-leaflet jspdf html2canvas

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run
npm run dev
```

## Appendix B: Useful Links

| Resource | URL |
|----------|-----|
| Django Docs | https://docs.djangoproject.com/en/5.1/ |
| DRF Docs | https://www.django-rest-framework.org/ |
| React Docs | https://react.dev/ |
| Tailwind Docs | https://tailwindcss.com/docs |
| Leaflet Docs | https://leafletjs.com/reference.html |
| React-Leaflet Docs | https://react-leaflet.js.org/ |
| OpenRouteService | https://openrouteservice.org/dev/ |
| Nominatim | https://nominatim.org/release-docs/latest/ |
| Overpass API | https://wiki.openstreetmap.org/wiki/Overpass_API |

## Appendix C: FMCSA Reference

Official HOS regulations:
https://www.fmcsa.dot.gov/regulations/hours-service/summary-hours-service-regulations

---

# End of PRD

**Document Version**: 2.0
**Total Pages**: ~50
**Last Updated**: January 17, 2026

---

**Ready to build? Start with MVP 1!**
