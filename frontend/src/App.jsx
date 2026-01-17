import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Placeholder routes for future pages */}
              <Route
                path="/trip-planner"
                element={
                  <ProtectedRoute>
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <h1 className="text-2xl font-bold">Trip Planner</h1>
                      <p className="text-gray-600 mt-2">Coming in MVP 2...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <div className="max-w-7xl mx-auto px-4 py-8">
                      <h1 className="text-2xl font-bold">Trip History</h1>
                      <p className="text-gray-600 mt-2">Coming in MVP 6...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
              
              {/* 404 Not Found */}
              <Route
                path="*"
                element={
                  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-300">404</h1>
                      <p className="text-xl text-gray-600 mt-4">Page not found</p>
                      <a
                        href="/"
                        className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
