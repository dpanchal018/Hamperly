'use client';

import React, { useState } from 'react';
import { CustomizationCategory, CustomizationOption } from '@/types/customization.types';
import { 
  saveCustomizationCategory, 
  deleteCustomizationCategory, 
  saveCustomizationOption, 
  deleteCustomizationOption 
} from '@/actions/customization.actions';
import { 
  Sliders, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Sparkles, Layers, Check, AlertCircle, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface Props {
  initialCategories: CustomizationCategory[];
}

export function CustomizationsManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<CustomizationCategory[]>(initialCategories);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(initialCategories[0]?.id || null);

  // Modal / Form state for Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomizationCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catRequired, setCatRequired] = useState(false);
  const [catAllowMultiple, setCatAllowMultiple] = useState(false);
  const [catOrder, setCatOrder] = useState(1);
  const [catActive, setCatActive] = useState(true);
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Modal / Form state for Option
  const [isOptModalOpen, setIsOptModalOpen] = useState(false);
  const [selectedCatIdForOpt, setSelectedCatIdForOpt] = useState<string>('');
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null);
  const [optName, setOptName] = useState('');
  const [optDesc, setOptDesc] = useState('');
  const [optPrice, setOptPrice] = useState(0);
  const [optOrder, setOptOrder] = useState(1);
  const [optActive, setOptActive] = useState(true);
  const [isSavingOpt, setIsSavingOpt] = useState(false);

  const openCategoryModal = (cat?: CustomizationCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatDesc(cat.description || '');
      setCatRequired(cat.is_required);
      setCatAllowMultiple(cat.allow_multiple);
      setCatOrder(cat.display_order || 1);
      setCatActive(cat.is_active);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      setCatRequired(false);
      setCatAllowMultiple(false);
      setCatOrder((categories.length || 0) + 1);
      setCatActive(true);
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      return toast.error('Category name is required.');
    }

    setIsSavingCat(true);
    const categoryPayload: CustomizationCategory = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: catName.trim(),
      description: catDesc.trim() || null,
      is_required: catRequired,
      allow_multiple: catAllowMultiple,
      display_order: Number(catOrder) || 1,
      is_active: catActive,
      options: editingCategory ? editingCategory.options : []
    };

    const res = await saveCustomizationCategory(categoryPayload);
    setIsSavingCat(false);

    if (res.success) {
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      setIsCatModalOpen(false);
      if (editingCategory) {
        setCategories(prev => prev.map(c => c.id === categoryPayload.id ? { ...categoryPayload, options: c.options } : c));
      } else {
        setCategories(prev => [...prev, categoryPayload]);
        setExpandedCatId(categoryPayload.id);
      }
    } else {
      toast.error(res.error || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this customization category and all its options?')) return;
    const res = await deleteCustomizationCategory(categoryId);
    if (res.success) {
      toast.success('Category deleted.');
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } else {
      toast.error(res.error || 'Failed to delete category.');
    }
  };

  const openOptionModal = (categoryId: string, opt?: CustomizationOption) => {
    setSelectedCatIdForOpt(categoryId);
    const category = categories.find(c => c.id === categoryId);
    const currentOptions = category?.options || [];

    if (opt) {
      setEditingOption(opt);
      setOptName(opt.name);
      setOptDesc(opt.description || '');
      setOptPrice(opt.price);
      setOptOrder(opt.display_order || 1);
      setOptActive(opt.is_active);
    } else {
      setEditingOption(null);
      setOptName('');
      setOptDesc('');
      setOptPrice(0);
      setOptOrder(currentOptions.length + 1);
      setOptActive(true);
    }
    setIsOptModalOpen(true);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optName.trim()) {
      return toast.error('Option name is required.');
    }

    setIsSavingOpt(true);
    const optionPayload: CustomizationOption = {
      id: editingOption ? editingOption.id : `opt-${Date.now()}`,
      category_id: selectedCatIdForOpt,
      name: optName.trim(),
      description: optDesc.trim() || null,
      price: Math.max(0, Number(optPrice) || 0),
      display_order: Number(optOrder) || 1,
      is_active: optActive,
      image_url: null
    };

    const res = await saveCustomizationOption(optionPayload);
    setIsSavingOpt(false);

    if (res.success) {
      toast.success(editingOption ? 'Option updated!' : 'Option added!');
      setIsOptModalOpen(false);

      setCategories(prev => prev.map(cat => {
        if (cat.id !== selectedCatIdForOpt) return cat;
        const options = cat.options || [];
        const optExists = options.some(o => o.id === optionPayload.id);
        const updatedOptions = optExists
          ? options.map(o => o.id === optionPayload.id ? optionPayload : o)
          : [...options, optionPayload];
        return {
          ...cat,
          options: updatedOptions.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        };
      }));
    } else {
      toast.error(res.error || 'Failed to save option.');
    }
  };

  const handleDeleteOption = async (categoryId: string, optionId: string) => {
    if (!confirm('Are you sure you want to delete this customization option?')) return;
    const res = await deleteCustomizationOption(categoryId, optionId);
    if (res.success) {
      toast.success('Option deleted.');
      setCategories(prev => prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return { ...cat, options: (cat.options || []).filter(o => o.id !== optionId) };
      }));
    } else {
      toast.error(res.error || 'Failed to delete option.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-indigo-600" />
            Hamper Customization Engine
          </h1>
          <p className="text-slate-500 mt-1">
            Configure dynamic customization categories, selection rules (Required / Multi-select), and fixed ₹ selling prices.
          </p>
        </div>
        <Button 
          onClick={() => openCategoryModal()}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 px-6"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-6">
        {categories.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Customization Categories</h3>
            <p className="text-slate-500 mb-6 text-sm">Add packaging, ribbons, cards, or finishing touches for customers.</p>
            <Button onClick={() => openCategoryModal()} className="rounded-full bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create First Category
            </Button>
          </div>
        ) : (
          categories.map((cat, idx) => {
            const isExpanded = expandedCatId === cat.id;
            const options = cat.options || [];

            return (
              <div 
                key={cat.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Category Header */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {cat.display_order || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
                        {cat.is_required ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Required Selection
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Optional
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {cat.allow_multiple ? 'Multi-Select' : 'Single-Select'}
                        </span>
                        {!cat.is_active && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openCategoryModal(cat)}
                      className="rounded-full text-slate-600 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded-full text-slate-400 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                      className="rounded-full p-2"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </Button>
                  </div>
                </div>

                {/* Options Section */}
                {isExpanded && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Configured Options ({options.length})
                      </h3>
                      <Button 
                        size="sm" 
                        onClick={() => openOptionModal(cat.id)}
                        className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs px-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                      </Button>
                    </div>

                    {options.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-sm text-slate-500 mb-3">No options configured for this category yet.</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openOptionModal(cat.id)}
                          className="rounded-full"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {options.map((opt) => (
                          <div 
                            key={opt.id} 
                            className={`p-4 rounded-xl border transition-all ${
                              opt.is_active ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'
                            } flex flex-col justify-between`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 text-base">{opt.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  opt.price > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  ₹{opt.price}
                                </span>
                              </div>
                              {opt.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{opt.description}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs">
                              <span className="text-slate-400">Order: #{opt.display_order || 1}</span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => openOptionModal(cat.id, opt)}
                                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                                  title="Edit Option"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteOption(cat.id, opt.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                  title="Delete Option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingCategory ? 'Edit Customization Category' : 'New Customization Category'}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Packaging, Ribbon, Greeting Card"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief helper text shown to customer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={catOrder}
                    onChange={(e) => setCatOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={catActive}
                      onChange={(e) => setCatActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catRequired}
                    onChange={(e) => setCatRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">Required Selection</span>
                    <p className="text-xs text-slate-500">Customer must choose an option before confirming hamper.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-200/60">
                  <input
                    type="checkbox"
                    checked={catAllowMultiple}
                    onChange={(e) => setCatAllowMultiple(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">Allow Multiple Selections</span>
                    <p className="text-xs text-slate-500">Enable multi-select checkboxes instead of single radio pick.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCatModalOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingCat}
                  className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-6"
                >
                  {isSavingCat ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Modal */}
      {isOptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingOption ? 'Edit Customization Option' : 'New Customization Option'}
            </h2>
            <form onSubmit={handleSaveOption} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Option Name *</label>
                <input
                  type="text"
                  required
                  value={optName}
                  onChange={(e) => setOptName(e.target.value)}
                  placeholder="e.g. Velvet Keepsake Box, Gold Ribbon"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={optDesc}
                  onChange={(e) => setOptDesc(e.target.value)}
                  placeholder="Short description of this option"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fixed Selling Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      required
                      value={optPrice}
                      onChange={(e) => setOptPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">Set 0 for free options (e.g. Moods)</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={optOrder}
                    onChange={(e) => setOptOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optActive}
                    onChange={(e) => setOptActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Active (Visible in Storefront)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOptModalOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSavingOpt}
                  className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-6"
                >
                  {isSavingOpt ? 'Saving...' : 'Save Option'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
