import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={() => {
        setIsMenuOpen(false);
        onClick?.();
      }}
      className={`
        block px-4 py-3 min-h-[44px] text-base font-medium rounded-lg
        transition-colors
        ${isActive(to) 
          ? 'text-primary-600 bg-primary-50' 
          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={isAuthenticated ? '/dashboard' : '/'} 
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">ELD Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/trip-planner">Plan Trip</NavLink>
                <NavLink to="/history">History</NavLink>
                <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Hi, {user?.name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/register"
                  className="ml-2 px-4 py-2 min-h-[44px] bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] p-2 text-gray-700 hover:text-primary-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 mb-2">
                    Signed in as <span className="font-medium text-gray-900">{user?.name}</span>
                  </div>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/trip-planner">Plan Trip</NavLink>
                  <NavLink to="/history">History</NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/register">Create Account</NavLink>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
