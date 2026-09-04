'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreMadeHamper, Occasion, PackagingType, Gender, RecipientTag } from '@/types/database.types';
import { createHamper, updateHamper, deleteHamper, upsertHamperItems } from '@/actions/hamper.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, ArrowLeft, Trash2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface HamperFormProps {
  initialData?: PreMadeHamper & { recipientTagIds?: number[] };
  initialItems?: any[];
  occasions?: Occasion[];
  packagingTypes?: PackagingType[];
  genders?: Gender[];
  recipientTags?: RecipientTag[];
  products?: any[];
}

export function HamperForm({ 
  initialData,
  initialItems = [],
  occasions = [],
  packagingTypes = [],
  genders = [],
  recipientTags = [],
  products = []
}: HamperFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    stock_quantity: initialData?.stock_quantity || 0,
    selling_price: initialData?.selling_price || 0,
    actual_cost: initialData?.actual_cost || 0,
    is_active: initialData?.is_active ?? true,
    occasion_id: initialData?.occasion_id || '',
    packaging_type_id: initialData?.packaging_type_id || '',
    gender_id: initialData?.gender_id || '',
  });

  const [selectedRecipientTags, setSelectedRecipientTags] = useState<number[]>(
    initialData?.recipientTagIds || []
  );

  const [recipeItems, setRecipeItems] = useState(
    initialItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      is_required: item.is_required,
      min_qty: item.min_qty,
      max_qty: item.max_qty,
      product: item.product
    }))
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleRecipientTagToggle = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRecipientTags(prev => [...prev, id]);
    } else {
      setSelectedRecipientTags(prev => prev.filter(t => t !== id));
    }
  };

  const addRecipeItem = (productId: string) => {
    if (!productId) return;
    const product = products.find(p => p.id === productId);
    if (!product || recipeItems.some(item => item.product_id === productId)) return;

    setRecipeItems(prev => [
      ...prev,
      {
        product_id: productId,
        quantity: 1,
        is_required: true,
        min_qty: 1,
        max_qty: 1,
        product: product
      }
    ]);
  };

  const removeRecipeItem = (productId: string) => {
    setRecipeItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateRecipeItem = (productId: string, field: string, value: any) => {
    setRecipeItems(prev => prev.map(item => 
      item.product_id === productId ? { ...item, [field]: value } : item
    ));
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
      const payload: any = {
        ...formData,
        occasion_id: formData.occasion_id || null,
        // packaging_type_id/gender_id are INTEGER FKs, but <select> values are always
        // strings — parse them, matching how admin.products.actions.ts handles gender_id.
        packaging_type_id: formData.packaging_type_id ? parseInt(formData.packaging_type_id as string) : null,
        gender_id: formData.gender_id ? parseInt(formData.gender_id as string) : null,
      };

      let hamperId = initialData?.id;

      if (hamperId) {
        const { error: submitError } = await updateHamper(hamperId, payload);
        if (submitError) throw new Error(submitError);
      } else {
        const { hamper, error: submitError } = await createHamper(payload);
        if (submitError || !hamper) throw new Error(submitError || 'Failed to create hamper');
        hamperId = hamper.id;
      }
      
      // Upsert tags
      const supabase = createClient();
      await supabase.from('hamper_recipient_tags').delete().eq('hamper_id', hamperId);
      if (selectedRecipientTags.length > 0) {
        await supabase.from('hamper_recipient_tags').insert(
          selectedRecipientTags.map(tagId => ({ hamper_id: hamperId, recipient_tag_id: tagId }))
        );
      }
      
      // Upsert Recipe Items
      const { error: recipeError } = await upsertHamperItems(hamperId, recipeItems);
      if (recipeError) throw new Error(recipeError);
      
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

  const calculatedValue = recipeItems.reduce((sum, item) => sum + ((item.product?.selling_price || 0) * item.quantity), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-10">
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
        <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Basic Information</h2>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
            <Input 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              placeholder="e.g. glass-boys-hamper" 
            />
          </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Occasion</label>
            <select 
              name="occasion_id" 
              value={formData.occasion_id} 
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select an Occasion</option>
              {occasions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Packaging Type</label>
            <select 
              name="packaging_type_id" 
              value={formData.packaging_type_id} 
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select Packaging</option>
              {packagingTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Gender</label>
            <select 
              name="gender_id" 
              value={formData.gender_id} 
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Unisex / Any</option>
              {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Recipient Tags</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border rounded-md bg-gray-50 max-h-48 overflow-y-auto">
            {recipientTags.map(tag => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tag-${tag.id}`} 
                  checked={selectedRecipientTags.includes(tag.id)}
                  onCheckedChange={(checked) => handleRecipientTagToggle(tag.id, checked as boolean)}
                />
                <label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer text-sm">{tag.name}</label>
              </div>
            ))}
          </div>
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
            {recipeItems.length > 0 && <p className="text-xs text-slate-500 mt-1">Sum of Items: ₹{calculatedValue.toFixed(2)}</p>}
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
            {/* Note: In a real app you might need to join to product_pricing to get true cost, here we rely on whatever is available */}
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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Recipe Builder (Contents)</h2>
        
        <div className="flex items-center space-x-2 max-w-sm">
          <select 
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            id="product_picker"
          >
            <option value="">Select a product to add...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>
            ))}
          </select>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const el = document.getElementById('product_picker') as HTMLSelectElement;
              addRecipeItem(el.value);
              el.value = '';
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="border rounded-md divide-y overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 w-24">Default Qty</th>
                <th className="px-4 py-3 w-24">Required</th>
                <th className="px-4 py-3 w-24">Min Qty</th>
                <th className="px-4 py-3 w-24">Max Qty</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {recipeItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No products added to this hamper recipe yet.
                  </td>
                </tr>
              )}
              {recipeItems.map((item) => (
                <tr key={item.product_id} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.product?.name || 'Unknown Product'}
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => updateRecipeItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)} 
                      className="w-full h-8 px-2"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Checkbox 
                      checked={item.is_required}
                      onCheckedChange={(c) => updateRecipeItem(item.product_id, 'is_required', c)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="0" 
                      value={item.min_qty || ''} 
                      onChange={(e) => updateRecipeItem(item.product_id, 'min_qty', e.target.value ? parseInt(e.target.value) : null)} 
                      className="w-full h-8 px-2"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="1" 
                      value={item.max_qty || ''} 
                      onChange={(e) => updateRecipeItem(item.product_id, 'max_qty', e.target.value ? parseInt(e.target.value) : null)} 
                      className="w-full h-8 px-2"
                      placeholder="∞"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      onClick={() => removeRecipeItem(item.product_id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
