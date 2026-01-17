import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Plan New Trip',
      description: 'Calculate route with HOS-compliant stops',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      href: '/trip-planner',
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'View History',
      description: 'Access your saved trips and logs',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/history',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name?.split(' ')[0] || 'Driver'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what you can do today
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-medium text-gray-900">{user?.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Truck Number</p>
              <p className="font-medium text-gray-900">{user?.truck_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Home Terminal</p>
              <p className="font-medium text-gray-900">{user?.home_terminal || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : '-'
                }
              </p>
            </div>
          </div>
        </div>

        {/* HOS Quick Reference */}
        <div className="mt-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">
            HOS Quick Reference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">11</p>
              <p className="text-sm text-primary-800">Max Driving Hours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">14</p>
              <p className="text-sm text-primary-800">On-Duty Window</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">30</p>
              <p className="text-sm text-primary-800">Min Break (mins)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary-600">70</p>
              <p className="text-sm text-primary-800">8-Day Cycle Limit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
