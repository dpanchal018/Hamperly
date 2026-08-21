'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreMadeHamper } from '@/types/database.types';
import { createHamper, updateHamper, deleteHamper } from '@/actions/hamper.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Textarea } from '@/components/ui/textarea';

interface HamperFormProps {
  initialData?: PreMadeHamper;
}

export function HamperForm({ initialData }: HamperFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    stock_quantity: initialData?.stock_quantity || 0,
    selling_price: initialData?.selling_price || 0,
    actual_cost: initialData?.actual_cost || 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? 0 : parseFloat(value)) : 
              value
    }));
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be less than 5MB.');
      return;
    }

    setImageError('');
    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `hampers/${fileName}`;

      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (initialData?.id) {
        const { error: submitError } = await updateHamper(initialData.id, formData);
        if (submitError) throw new Error(submitError);
      } else {
        const { error: submitError } = await createHamper(formData);
        if (submitError) throw new Error(submitError);
      }
      
      router.push('/admin/hampers');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Are you sure you want to delete this hamper?')) return;
    
    setLoading(true);
    try {
      const { error: deleteError } = await deleteHamper(initialData.id);
      if (deleteError) throw new Error(deleteError);
      router.push('/admin/hampers');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/admin/hampers" className="text-slate-500 hover:text-slate-700 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hampers
        </Link>
        {initialData && (
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Hamper Name</label>
          <Input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Glass Boys Hamper" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Hamper Image</label>
          <div className="flex flex-col space-y-4">
            {formData.image_url && (
              <img src={formData.image_url} alt="Hamper" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
            )}
            <div>
              <Input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="max-w-xs"
              />
              {uploadingImage && <p className="text-sm text-indigo-600 mt-2">Uploading image...</p>}
              {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <Textarea 
            name="description" 
            value={formData.description || ''} 
            onChange={handleChange} 
            placeholder="Describe the items in this pre-made hamper..."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quantity (Stock)</label>
            <Input 
              type="number" 
              name="stock_quantity" 
              value={formData.stock_quantity} 
              onChange={handleChange} 
              min="0" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Selling Price (₹)</label>
            <Input 
              type="number" 
              name="selling_price" 
              value={formData.selling_price} 
              onChange={handleChange} 
              min="0" 
              step="0.01" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Actual Cost (₹)</label>
            <Input 
              type="number" 
              name="actual_cost" 
              value={formData.actual_cost} 
              onChange={handleChange} 
              min="0" 
              step="0.01" 
              required 
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <input 
            type="checkbox" 
            id="is_active" 
            name="is_active" 
            checked={formData.is_active} 
            onChange={handleChange} 
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Active (Visible to customers)</label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Hamper'}
        </Button>
      </div>
    </form>
  );
}
