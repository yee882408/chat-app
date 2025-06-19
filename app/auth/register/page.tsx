'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { register, error, user, checkSession } = useAuthStore();
  const router = useRouter();

  // Check authentication status and redirect if needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await checkSession();
        if (isAuthenticated) {
          setIsRedirecting(true);
          // Use window.location for a hard redirect with cache-busting
          const redirectUrl = `/supabase-chat?t=${Date.now()}`;
          console.log('Auto-redirecting to chat page...');
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkAuth();
  }, [checkSession, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }

    if (username.trim().length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, username);
      setIsRedirecting(true);
      // Use window.location for a hard redirect with cache-busting
      const redirectUrl = `/supabase-chat?t=${Date.now()}`;
      console.log('Post-registration redirecting to chat page...');
      window.location.href = redirectUrl;
    } catch (err: any) {
      setFormError(err.message || 'Failed to register');
      setIsSubmitting(false);
    }
  };

  // State for showing manual redirect button
  const [showManualRedirect, setShowManualRedirect] = useState(false);

  // Show manual redirect button after 3 seconds
  useEffect(() => {
    if (isRedirecting) {
      const timer = setTimeout(() => {
        setShowManualRedirect(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isRedirecting]);

  // If already authenticated or redirecting, show loading state
  if (user || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">You are already logged in.</p>
          <p className="text-gray-500">Redirecting to chat...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>

          {showManualRedirect && (
            <div className="mt-6">
              <p className="text-amber-600 text-sm mb-2">
                If you're not being redirected automatically, please click the button below:
              </p>
              <button
                onClick={() => {
                  console.log('Redirecting to chat page...');
                  // Use window.location for a hard redirect instead of router.replace
                  const redirectUrl = `/supabase-chat?t=${Date.now()}`;
                  window.location.href = redirectUrl;
                }}
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Chat Manually
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Create an Account</h1>

        {(formError || error) && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="johndoe"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
