'use client';

import { X, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing if click is inside modal
      >
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
          <p className="text-slate-500 mb-8">Please log in or create a customer account to securely proceed with your checkout.</p>
          
          <div className="space-y-3">
            <Link 
              href="/login?redirect=/checkout" 
              onClick={onClose}
              className="flex items-center justify-center w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Log In to Account
            </Link>
            <Link 
              href="/signup?redirect=/checkout" 
              onClick={onClose}
              className="flex items-center justify-center w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-sm"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
