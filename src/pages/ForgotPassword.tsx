import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVfur9ihXl8pRZwojTY-KPbyKvhAj2br4",
  authDomain: "arif-d49f9.firebaseapp.com",
  projectId: "arif-d49f9",
  storageBucket: "arif-d49f9.firebasestorage.app",
  messagingSenderId: "83214662234",
  appId: "1:83214662234:web:1ad3986dfcbc7a20447663",
  measurementId: "G-EPTJ3RLEV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Initialize Analytics only if supported
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
  firebase?: string;
}

function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors] || errors.firebase) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
        firebase: undefined
      }));
    }
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, formData.email);

      // Log password reset event to Firebase Analytics if available
      if (analytics) {
        logEvent(analytics, 'password_reset', {
          method: 'email'
        });
      }

      // Show success message
      setSuccessMessage('Password reset email sent. Please check your inbox.');
      setFormData({ email: '' });
    } catch (error: any) {
      console.error('Password reset failed:', error);
      let errorMessage = 'An error occurred while sending the reset email';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An error occurred while sending the reset email';
      }

      setErrors({ firebase: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    console.log('Back to Login button clicked, navigating to /login');
    navigate('/login');
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
            <h1 className="text-3xl font-bold text-[#00BCEB] mb-2">Reset Password</h1>
            <p className="text-[#2D2D2D] text-lg">Enter your email to receive a password reset link</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {/* Firebase Error */}
          {errors.firebase && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errors.firebase}
            </div>
          )}

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
                  className={`block w-full pl-10 pr-3 py-3 bg-[#F5F7FA] border rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={Object.keys(validateForm()).length > 0 || isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center ${
                Object.keys(validateForm()).length === 0 && !isLoading
                  ? 'bg-[#00BCEB] hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Sending Reset Email...
                </>
              ) : (
                'Send Reset Email'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <p className="text-[#2D2D2D]">
              Remember your password?{' '}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-[#FF6B00] hover:text-[#e55a00] font-medium transition-colors duration-200"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;