'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSetup() {
  const [email, setEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const router = useRouter();

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, adminSecret }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Admin user set up successfully!',
        });
        // Clear the form
        setEmail('');
        setAdminSecret('');
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to set up admin user.',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Setup</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Security Warning</p>
              <p className="text-sm mt-1">This page should only be used once to set up the first admin user. After that, you should remove or secure this page.</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSetupAdmin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter user email to make admin"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the email of an existing user you want to make an admin.
            </p>
          </div>
          
          <div>
            <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Setup Secret
            </label>
            <input
              id="adminSecret"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin setup secret"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the secret key defined in your environment variables or hardcoded in the API route.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Set as Admin'}
          </button>
        </form>
        
        {result && (
          <div className={`mt-4 p-3 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {result.success ? (
              <div className="flex">
                <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{result.message}</span>
              </div>
            ) : (
              <div className="flex">
                <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{result.error}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/supabase-chat')}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Return to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
