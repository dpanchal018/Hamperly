'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteHamper } from '@/actions/hamper.actions';

export function DeleteHamperButton({ id, name }: { id: string, name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading('Deleting hamper...');

    try {
      const result = await deleteHamper(id);
      
      if (result.error) {
        toast.error(`Delete failed: ${result.error}`, { id: toastId });
      } else {
        toast.success('Hamper deleted successfully', { id: toastId });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
      title="Delete Hamper"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </Button>
  );
}
