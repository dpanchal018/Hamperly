'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bulkCreateHampers } from '@/actions/hamper.actions';
import { PreMadeHamper } from '@/types/database.types';

export function HamperImportButton() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file.');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Reading file...');

    try {
      const text = await file.text();
      // Basic CSV parsing
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) {
        toast.error('File is empty or missing headers.', { id: toastId });
        setIsImporting(false);
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['name', 'description', 'stock_quantity', 'selling_price', 'actual_cost'];
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`, { id: toastId });
        setIsImporting(false);
        return;
      }

      const data: Partial<PreMadeHamper>[] = [];

      for (let i = 1; i < rows.length; i++) {
        // Handle basic quotes to some extent, but for a simple split we assume no commas in values for this basic impl
        // A more robust implementation would use a library like papaparse
        const values = rows[i].split(',').map(v => v.trim());
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          if (expectedHeaders.includes(header)) {
            const val = values[index];
            if (header === 'stock_quantity' || header === 'selling_price' || header === 'actual_cost') {
              rowData[header] = parseFloat(val) || 0;
            } else {
              rowData[header] = val;
            }
          }
        });

        if (rowData.name) {
          data.push(rowData as Partial<PreMadeHamper>);
        }
      }

      if (data.length === 0) {
        toast.error('No valid rows found to import.', { id: toastId });
        setIsImporting(false);
        return;
      }

      toast.loading(`Importing ${data.length} hampers...`, { id: toastId });
      
      const result = await bulkCreateHampers(data);
      
      if (result.error) {
        toast.error(`Import failed: ${result.error}`, { id: toastId });
      } else {
        toast.success(`Successfully imported ${data.length} hampers!`, { id: toastId });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('An error occurred during import.', { id: toastId });
    } finally {
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <Button 
        onClick={handleImportClick} 
        disabled={isImporting}
        variant="outline"
        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
      >
        {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {isImporting ? 'Importing...' : 'Import CSV'}
      </Button>
    </>
  );
}
