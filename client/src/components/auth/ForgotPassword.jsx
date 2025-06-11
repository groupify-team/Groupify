import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from "../../contexts/ThemeContext";
import { 
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Implement password reset logic
      // await resetPassword(email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Success Message */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            {/* Header */}
            <div className="mb-8">
              {/* Navigation */}
              <div className="flex items-center justify-between mb-8">
                <Link
                  to="/signin"
                  className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back to Sign In
                </Link>
                
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Logo and Title */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Email Sent!
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Check your inbox
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We've sent a password reset link to <span className="font-medium text-indigo-600 dark:text-indigo-400">{email}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      What's next?
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>1. Check your email inbox (and spam folder)</p>
                      <p>2. Click the reset link in the email</p>
                      <p>3. Create a new password</p>
                      <p>4. Sign in with your new password</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full text-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  Send another email
                </button>
                
                <Link
                  to="/signin"
                  className="w-full btn-primary text-center py-3"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-gradient-to-br from-green-500 via-blue-600 to-indigo-600 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-white">
            <h2 className="text-4xl font-bold mb-6">
              We've got you covered
            </h2>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Don't worry about forgetting your password. We'll help you get back to organizing your memories in no time.
            </p>
            
            {/* Feature List */}
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Secure password reset process</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Email verification for security</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm">✓</span>
                </div>
                <span>Quick and easy process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Header */}
          <div className="mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/signin"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Sign In
              </Link>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Logo and Title */}
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Forgot your password?
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No worries! Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-primary pl-12"
                  placeholder="you@example.com"
                  disabled={loading}
                />
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center py-3 relative overflow-hidden"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending reset email...
                </>
              ) : (
                'Send reset email'
              )}
            </button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <Link
                to="/signin"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white">
          <h2 className="text-4xl font-bold mb-6">
            Get back to your memories
          </h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
            Don't let a forgotten password keep you away from your precious travel memories. 
            We'll help you regain access quickly and securely.
          </p>
          
          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Secure password reset</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Email verification</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Quick recovery process</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Protected account access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;