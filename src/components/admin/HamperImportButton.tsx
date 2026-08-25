'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bulkUpsertHampers } from '@/actions/hamper.actions';
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
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) {
        toast.error('File is empty or missing headers.', { id: toastId });
        setIsImporting(false);
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      // Make it a bit more flexible with column names
      const hasName = headers.some(h => h.includes('name'));
      
      if (!hasName) {
        toast.error('Missing required column: name', { id: toastId });
        setIsImporting(false);
        return;
      }

      const data: Partial<PreMadeHamper>[] = [];

      for (let i = 1; i < rows.length; i++) {
        // Parse CSV robustly (handling quotes for commas inside strings if needed, though basic for now)
        // Let's use a regex that handles quoted values correctly
        const values = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rows[i].split(',');
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
        
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          const val = cleanValues[index] || '';
          
          if (header.includes('name')) rowData.name = val;
          else if (header.includes('desc')) rowData.description = val;
          else if (header.includes('quant') || header.includes('stock')) rowData.stock_quantity = parseFloat(val) || 0;
          else if (header.includes('sell') || header.includes('price')) rowData.selling_price = parseFloat(val) || 0;
          else if (header.includes('cost')) rowData.actual_cost = parseFloat(val) || 0;
          else if (header.includes('active') || header.includes('status')) {
            rowData.is_active = val.toLowerCase() === 'true' || val.toLowerCase() === 'active' || val === '1';
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

      toast.loading(`Processing ${data.length} hampers (upsert)...`, { id: toastId });
      
      const result = await bulkUpsertHampers(data);
      
      if (result.error) {
        toast.error(`Import finished with some errors: ${result.error}`, { id: toastId, duration: 5000 });
      } else {
        toast.success(`Successfully imported/updated ${result.successCount} hampers!`, { id: toastId });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('An error occurred during import.', { id: toastId });
    } finally {
      setIsImporting(false);
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
