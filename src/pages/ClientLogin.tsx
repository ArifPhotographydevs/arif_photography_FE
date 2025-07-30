import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, Camera } from 'lucide-react';

function ClientLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo credentials for client login
      if (formData.email === 'sarah@email.com' && formData.password === 'client123') {
        // Store client session
        localStorage.setItem('client_session', 'true');
        localStorage.setItem('client_name', 'Sarah Johnson');
        navigate('/client/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // In a real app, this would open a forgot password modal or navigate to reset page
    alert('Please contact our support team for password reset assistance.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full mb-4">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Login</h1>
            <p className="text-gray-600">Access your bookings, galleries & invoices</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Phone Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-orange-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  placeholder="Enter your email or phone"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-orange-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-cyan-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center ${
                isFormValid && !isLoading
                  ? 'bg-cyan-600 hover:bg-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 text-center">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <p className="text-sm text-cyan-800 font-medium mb-2">Demo Credentials:</p>
              <p className="text-sm text-cyan-700">
                Email: <span className="font-mono">sarah@email.com</span><br />
                Password: <span className="font-mono">client123</span>
              </p>
            </div>
          </div>

          {/* Support Contact */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact{' '}
              <a 
                href="mailto:support@arifphotography.com" 
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                support@arifphotography.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientLogin;