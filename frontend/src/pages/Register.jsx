import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: '',
    company_name: '',
    truck_number: '',
    home_terminal: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const { register, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setApiError(null);

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.toLowerCase(),
      password: formData.password,
      password_confirm: formData.password_confirm,
      company_name: formData.company_name.trim(),
      truck_number: formData.truck_number.trim(),
      home_terminal: formData.home_terminal.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      // Handle API errors
      if (result.error?.details) {
        const fieldErrors = {};
        Object.entries(result.error.details).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(fieldErrors);
      } else {
        setApiError(result.error?.error || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600">
            Start planning HOS-compliant trips today
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {apiError && (
            <Alert 
              type="error" 
              message={apiError} 
              onClose={() => setApiError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Required Fields */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              error={errors.name}
              required
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="driver@example.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={errors.password}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={errors.password_confirm}
              required
              autoComplete="new-password"
            />

            {/* Optional Fields - Collapsible */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                <span>Optional: Driver Information</span>
                <svg 
                  className="w-5 h-5 transform transition-transform group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div className="pt-4 space-y-5">
                <Input
                  label="Company Name"
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="ABC Trucking"
                  autoComplete="organization"
                />

                <Input
                  label="Truck Number"
                  type="text"
                  name="truck_number"
                  value={formData.truck_number}
                  onChange={handleChange}
                  placeholder="1234"
                />

                <Input
                  label="Home Terminal"
                  type="text"
                  name="home_terminal"
                  value={formData.home_terminal}
                  onChange={handleChange}
                  placeholder="Green Bay, WI"
                />
              </div>
            </details>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full mt-6"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
