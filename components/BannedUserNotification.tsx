'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export const BannedUserToast = () => {
  const { isBanned } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isBanned) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // Hide after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isBanned]);

  if (!isBanned || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md animate-fade-in">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="font-bold">Account Restricted</p>
          <p className="text-sm">Your account has been banned. You can view chats but cannot send messages or create new chats.</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-auto -mx-1.5 -my-1.5 bg-red-600 text-white rounded-lg p-1.5 hover:bg-red-700 focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const BannedUserModal = () => {
  const { isBanned } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal on initial login if user is banned
    if (isBanned) {
      setIsOpen(true);
    }
  }, [isBanned]);

  if (!isBanned) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-center mb-4 text-red-500">
          <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Account Restricted</h3>
        <div className="text-gray-700 mb-6">
          <p className="mb-3">Your account has been banned by an administrator.</p>
          <p className="mb-3">While banned, you can:</p>
          <ul className="list-disc pl-5 mb-3">
            <li>View existing chats and messages</li>
            <li>Navigate between chat rooms</li>
          </ul>
          <p className="mb-3">You cannot:</p>
          <ul className="list-disc pl-5 mb-3">
            <li>Send new messages</li>
            <li>Create new chat rooms</li>
          </ul>
          <p>If you believe this is a mistake, please contact an administrator.</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
