'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProductAction, updateProductAction } from '@/actions/admin.products.actions';
import { Product, Category, Occasion, ProductPricing, Gender, RecipientTag } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { getInventoryStatus, getInventoryStatusColor } from '@/lib/inventory';

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  status: z.enum(['draft', 'active', 'archived']),
  stock_quantity: z.number().int().nullable(), // Null means unlimited
  cost_price: z.number().nonnegative("Cost price cannot be negative"),
  target_margin: z.number().min(0).max(0.99, "Margin must be strictly less than 100% (0.99)"),
  occasion_ids: z.array(z.string()),
  recipient_tag_ids: z.array(z.number()),
  image_url: z.string().optional(),
  sku: z.string().optional(),
  gender_id: z.number().nullable().optional(),
  is_customizable: z.boolean(),
  min_quantity: z.number().int().min(1),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product & { pricing?: ProductPricing, occasionIds?: string[], recipientTagIds?: number[], primaryImageUrl?: string };
  categories: Category[];
  occasions: Occasion[];
  genders: Gender[];
  recipientTags: RecipientTag[];
}

export default function ProductForm({ initialData, categories, occasions, genders, recipientTags }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      category_id: initialData?.category_id || '',
      status: initialData?.status || 'draft',
      stock_quantity: initialData?.stock_quantity ?? null,
      cost_price: initialData?.pricing?.cost_price || 0,
      target_margin: initialData?.pricing?.target_margin || 0.25,
      occasion_ids: initialData?.occasionIds || [],
      recipient_tag_ids: initialData?.recipientTagIds || [],
      image_url: initialData?.primaryImageUrl || '',
      sku: initialData?.sku || '',
      gender_id: initialData?.gender_id || null,
      is_customizable: initialData?.is_customizable || false,
      min_quantity: initialData?.min_quantity || 1,
    }
  });

  const costPrice = watch('cost_price');
  const targetMargin = watch('target_margin');
  const selectedOccasions = watch('occasion_ids');
  const selectedRecipientTags = watch('recipient_tag_ids');
  const currentImageUrl = watch('image_url');
  const currentStock = watch('stock_quantity');
  
  // Real-time calculation for UX
  const computedSellingPrice = (costPrice / (1 - targetMargin)).toFixed(2);
  const computedProfit = ((costPrice / (1 - targetMargin)) - costPrice).toFixed(2);

  const handleOccasionToggle = (id: string, checked: boolean) => {
    if (checked) {
      setValue('occasion_ids', [...selectedOccasions, id]);
    } else {
      setValue('occasion_ids', selectedOccasions.filter(o => o !== id));
    }
  };

  const handleRecipientTagToggle = (id: number, checked: boolean) => {
    if (checked) {
      setValue('recipient_tag_ids', [...selectedRecipientTags, id]);
    } else {
      setValue('recipient_tag_ids', selectedRecipientTags.filter(t => t !== id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type & size
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
      const filePath = `products/${fileName}`;

      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setValue('image_url', publicUrl);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
           if (key === 'occasion_ids' || key === 'recipient_tag_ids') {
             formData.append(key, JSON.stringify(value));
           } else if (value !== null && value !== undefined) {
             formData.append(key, value.toString());
           } else if (value === null) {
             formData.append(key, ''); // Send empty string for nulls
           }
        });

        if (initialData) {
          await updateProductAction(initialData.id, formData);
        } else {
          await createProductAction(formData);
        }
        router.push('/admin/products');
      } catch (error: any) {
        alert(error.message || 'Something went wrong while saving the product.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl pb-10">
      
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name')} placeholder="Premium Chocolate Box" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="premium-chocolate-box" />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input id="sku" {...register('sku')} placeholder="CHOC-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender_id">Target Gender</Label>
              <select 
                id="gender_id" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={watch('gender_id') || ''}
                onChange={(e) => setValue('gender_id', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Unisex / Any</option>
                {genders.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={4} />
          </div>
          
          <div className="flex flex-row items-center gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_customizable" 
                checked={watch('is_customizable')}
                onCheckedChange={(checked) => setValue('is_customizable', checked as boolean)}
              />
              <Label htmlFor="is_customizable">Is Customizable (e.g., engravable)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="min_quantity" className="whitespace-nowrap">Min Qty:</Label>
              <Input 
                id="min_quantity" 
                type="number" 
                min="1"
                className="w-20"
                {...register('min_quantity', { valueAsNumber: true })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorization & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="category_id">Category</Label>
            <select 
              id="category_id" 
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              {...register('category_id')}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-sm text-red-500">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Occasions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                {occasions.map(occ => (
                  <div key={occ.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`occ-${occ.id}`} 
                      checked={selectedOccasions.includes(occ.id)}
                      onCheckedChange={(checked) => handleOccasionToggle(occ.id, checked as boolean)}
                    />
                    <Label htmlFor={`occ-${occ.id}`} className="font-normal cursor-pointer text-sm">
                      {occ.parent_id ? <span className="text-slate-400 mr-1">↳</span> : null}
                      {occ.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recipient Tags</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                {recipientTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag.id}`} 
                      checked={selectedRecipientTags.includes(tag.id)}
                      onCheckedChange={(checked) => handleRecipientTagToggle(tag.id, checked as boolean)}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer text-sm">{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentImageUrl && (
            <div className="mb-4">
              <img src={currentImageUrl} alt="Product Preview" className="h-48 w-48 object-cover rounded-md border" />
              <Button type="button" variant="link" className="text-red-500 p-0 h-auto mt-2" onClick={() => setValue('image_url', '')}>
                Remove Image
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="image_upload">Upload Primary Image</Label>
            <Input 
              id="image_upload" 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            {uploadingImage && <p className="text-sm text-blue-500">Uploading...</p>}
            {imageError && <p className="text-sm text-red-500">{imageError}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Pricing Configuration
            <span className="text-xs font-normal bg-red-100 text-red-800 px-2 py-1 rounded">ADMIN ONLY</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Supplier Cost (₹)</Label>
              <Input id="cost_price" type="number" step="0.01" {...register('cost_price', { valueAsNumber: true })} />
              {errors.cost_price && <p className="text-sm text-red-500">{errors.cost_price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_margin">Target Gross Margin (e.g. 0.25 for 25%)</Label>
              <Input id="target_margin" type="number" step="0.01" {...register('target_margin', { valueAsNumber: true })} />
              {errors.target_margin && <p className="text-sm text-red-500">{errors.target_margin.message}</p>}
            </div>
          </div>
          
          <div className="p-4 bg-slate-100 rounded-md grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Calculated Selling Price</p>
              <p className="text-2xl font-bold text-slate-900">₹{isNaN(Number(computedSellingPrice)) ? '0.00' : computedSellingPrice}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Computed Profit</p>
              <p className="text-2xl font-bold text-green-600">₹{isNaN(Number(computedProfit)) ? '0.00' : computedProfit}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Note: The backend calculates the final authoritative price. This preview is for your convenience.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <div className="flex items-center space-x-4">
                <Input id="stock_quantity" type="number" className="w-1/2" {...register('stock_quantity', { valueAsNumber: true })} />
                <div className="flex-1">
                  <span className={`px-3 py-1 rounded text-xs font-semibold border ${getInventoryStatusColor(getInventoryStatus(currentStock))}`}>
                    {getInventoryStatus(currentStock)}
                  </span>
                </div>
              </div>
              {errors.stock_quantity && <p className="text-sm text-red-500">{errors.stock_quantity.message}</p>}
            </div>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                {...register('status')}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived (Inactive)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button type="submit" size="lg" disabled={isPending || uploadingImage}>
          {isPending ? 'Saving...' : 'Save Product'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push('/admin/products')} disabled={isPending}>
          Cancel
        </Button>
      </div>

    </form>
  );
}
