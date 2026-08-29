'use client';

import { Printer } from 'lucide-react';

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
    >
      <Printer className="w-4 h-4 mr-2" />
      Print / Save Invoice
    </button>
  );
}
