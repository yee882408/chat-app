'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { login, error, user, checkSession } = useAuthStore();
  const router = useRouter();

  // Check authentication status and redirect if needed
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await checkSession();
        console.log('isAuthenticated:', isAuthenticated);
        if (isAuthenticated) {
          setIsRedirecting(true);
          // Use window.location for a hard redirect with cache-busting
          const redirectUrl = `/supabase-chat?t=${Date.now()}`;
          console.log(redirectUrl);
          // // console.log('Auto-redirecting to chat page...');
          // window.location.href = redirectUrl;
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

    if (!password) {
      setFormError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      setIsRedirecting(true);
      // Use window.location for a hard redirect with cache-busting
      const redirectUrl = `/supabase-chat?t=${Date.now()}`;
      console.log('Post-login redirecting to chat page...');
      window.location.href = redirectUrl;
    } catch (err: any) {
      setFormError(err.message || 'Failed to login');
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
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login to Chat App</h1>

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

          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
