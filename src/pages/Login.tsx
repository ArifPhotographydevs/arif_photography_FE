import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

function Login() {
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
      
      // Simulate login failure for demo
      if (formData.email === 'demo@arif.com' && formData.password === 'password123') {
        // Redirect to dashboard (in a real app)
        console.log('Login successful - redirect to dashboard');
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Try again.');
      }
    } catch (err) {
      setError('Invalid credentials. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00BCEB] to-[#00A5CF] rounded-full mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-[#00BCEB] mb-2">Arif</h1>
            <p className="text-[#2D2D2D] text-lg">Welcome back to Arif CRM</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2D2D2D] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#00BCEB] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-[#FF6B00] hover:text-[#e55a00] text-sm font-medium transition-colors duration-200"
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
                  ? 'bg-[#00BCEB] hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-[#2D2D2D]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#FF6B00] hover:text-[#e55a00] font-medium transition-colors duration-200"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Demo credentials: demo@arif.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;