'use client';

import { useState } from 'react';
import { BotMessageSquare } from 'lucide-react';
import AdminCopilot from './AdminCopilot';

export default function AdminCopilotWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all z-40 group flex items-center space-x-2"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <BotMessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 font-medium">
          Ask AI Store Manager
        </span>
      </button>

      <AdminCopilot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
