'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSuccess(false);
    
    // Validate form
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Reset Password</h1>
        
        {isSuccess ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
              <p>Password reset email sent!</p>
              <p className="text-sm mt-2">Check your email for a link to reset your password.</p>
            </div>
            
            <Link href="/auth/login" className="text-blue-500 hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
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
              
              <button
                type="submit"
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
