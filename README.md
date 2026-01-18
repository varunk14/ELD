# ELD Trip Planner

A full-stack web application for truck drivers to plan HOS-compliant trips with automatic ELD log sheet generation.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![Django](https://img.shields.io/badge/Django-5.x-092E20?logo=django)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Live Demo

- **Frontend:** [https://eld-delta.vercel.app](https://eld-delta.vercel.app)
- **Backend API:** [https://varunkrishna.pythonanywhere.com](https://varunkrishna.pythonanywhere.com)

## Features

- **Route Planning** - Enter current location, pickup, and dropoff to calculate optimal routes
- **HOS Compliance** - Automatically calculates breaks and rest stops per FMCSA regulations
- **Interactive Map** - Visualize routes with all stops marked (Leaflet + OpenStreetMap)
- **ELD Log Sheets** - Generates official DOT-format log sheets with duty status graph
- **PDF Export** - Download individual or all log sheets as PDF
- **Trip History** - Save and view past trip plans
- **User Authentication** - Secure JWT-based authentication

## FMCSA HOS Rules Implemented

| Rule | Limit | Description |
|------|-------|-------------|
| Driving Limit | 11 hours | Max driving after 10 consecutive hours off duty |
| On-Duty Window | 14 hours | Cannot drive after 14th consecutive hour on duty |
| 30-Min Break | Required | After 8 cumulative hours of driving |
| Off-Duty | 10 hours | Required before driving again |
| Cycle Limit | 70 hours | Max on-duty in 8 consecutive days |
| Restart | 34 hours | Resets 70-hour cycle |

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Leaflet + React-Leaflet
- Axios
- jsPDF (PDF export)

### Backend
- Django 5.x + Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication (SimpleJWT)
- OpenRouteService API (routing)
- Photon/Nominatim API (geocoding)

## Project Structure

```
ELD/
├── backend/
│   ├── config/          # Django settings
│   ├── users/           # Authentication app
│   ├── trips/           # Trip planning app
│   │   ├── services/    # HOS calculator, routing, geocoding
│   │   └── tests.py     # 50 comprehensive tests
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth context
│   │   └── services/    # API services
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your settings

python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
ORS_API_KEY=your-openrouteservice-api-key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000/api
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get tokens |
| POST | `/api/auth/logout/` | Logout (blacklist token) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/calculate/` | Calculate trip with HOS schedule |
| GET | `/api/trips/` | List user's trips |
| GET | `/api/trips/<id>/` | Get trip details |
| DELETE | `/api/trips/<id>/delete/` | Delete a trip |

### Geocoding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/geocode/?address=` | Search for addresses |

## Running Tests

```bash
cd backend
source venv/bin/activate
python manage.py test trips --verbosity=2
```

**Test Coverage:** 50 tests covering HOS calculations, API endpoints, and models.

## Deployment

- **Frontend:** Deployed on [Vercel](https://vercel.com)
- **Backend:** Deployed on [PythonAnywhere](https://pythonanywhere.com)

## License

MIT License - feel free to use this project for learning or building upon.

## Author

**Varun Krishna**

---

*Built as a demonstration of full-stack development with Django and React*
