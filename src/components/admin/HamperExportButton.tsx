'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getHampers } from '@/actions/hamper.actions';

export function HamperExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exporting data...');

    try {
      const hampers = await getHampers();
      
      if (!hampers || hampers.length === 0) {
        toast.error('No hampers found to export.', { id: toastId });
        return;
      }

      // Prepare CSV content
      const headers = ['Sr. No.', 'Hamper Name', 'Description', 'Quantity', 'Selling Price', 'Actual Cost', 'Is Active'];
      const csvRows = [headers.join(',')];

      hampers.forEach((hamper, index) => {
        const row = [
          index + 1,
          `"${(hamper.name || '').replace(/"/g, '""')}"`,
          `"${(hamper.description || '').replace(/"/g, '""')}"`,
          hamper.stock_quantity || 0,
          hamper.selling_price || 0,
          hamper.actual_cost || 0,
          hamper.is_active ? 'True' : 'False'
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `hampers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export successful!', { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred during export.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExportClick} 
      disabled={isExporting}
      variant="outline"
      className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
    >
      {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
