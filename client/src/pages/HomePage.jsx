import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-white text-2xl font-bold">Groupify</h1>
          <nav>
            {currentUser ? (
              <Link
                to="/dashboard"
                className="text-white hover:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/signin"
                  className="text-white hover:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-5xl font-extrabold text-white mb-4">
              Share Your Trip Memories
            </h2>
            <p className="text-xl text-white mb-8">
              Upload photos, find your shots, and relive the moments together
            </p>
            {currentUser ? (
              <Link
                to="/dashboard"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-md text-lg font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/signup"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-md text-lg font-medium"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;