'use client';

import { useState } from 'react';
import { Event } from '@/types/database.types';
import { createEvent, updateEvent, deleteEvent } from '@/actions/event.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EventsManagerProps {
  occasionId: string;
  initialEvents: Event[];
}

export function EventsManager({ occasionId, initialEvents }: EventsManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(events.length + 1);

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setName(event.name);
      setSlug(event.slug);
      setDescription(event.description || '');
      setImageUrl(event.image_url || '');
      setIsActive(event.is_active);
      setDisplayOrder(event.display_order || 1);
    } else {
      setEditingEvent(null);
      setName('');
      setSlug('');
      setDescription('');
      setImageUrl('');
      setIsActive(true);
      setDisplayOrder(events.length + 1);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const supabase = createClient();
      const { error } = await supabase.storage.from('product-images').upload(filePath, file, { upsert: false });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required.');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      is_active: isActive,
      display_order: Number(displayOrder) || 0,
    };

    const res = editingEvent
      ? await updateEvent(editingEvent.id, payload)
      : await createEvent({ occasion_id: occasionId, ...payload });

    setIsSaving(false);

    if ('error' in res && res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(editingEvent ? 'Event updated!' : 'Event created!');
    setIsModalOpen(false);
    if (res.event) {
      setEvents(prev => {
        const exists = prev.some(ev => ev.id === res.event!.id);
        const updated = exists
          ? prev.map(ev => ev.id === res.event!.id ? res.event! : ev)
          : [...prev, res.event!];
        return updated.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    setIsDeleting(event.id);
    const res = await deleteEvent(event.id, occasionId);
    setIsDeleting(null);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Event deleted.');
    setEvents(prev => prev.filter(ev => ev.id !== event.id));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Events</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sub-items shown on this occasion&apos;s page (e.g. Diwali, Holi under Festivals), not on the homepage.</p>
        </div>
        <Button type="button" size="sm" onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No events yet for this occasion.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {events.map(event => (
            <div key={event.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{event.name}</span>
                  {!event.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Inactive</span>
                  )}
                </div>
                <span className="text-xs text-slate-400">/{event.slug}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => openModal(event)} className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => handleDelete(event)} disabled={isDeleting === event.id} className="p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                  {isDeleting === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Event Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug *</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. diwali" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description shown on the event page" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Image</label>
                <div className="flex flex-col space-y-2">
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Event" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="max-w-xs" />
                  {uploadingImage && <p className="text-xs text-indigo-600">Uploading...</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
                  <Input type="number" min={1} value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-semibold text-slate-700">Active (visible to customers)</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={isSaving || uploadingImage} className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 px-6">
                  {isSaving ? 'Saving...' : 'Save Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
