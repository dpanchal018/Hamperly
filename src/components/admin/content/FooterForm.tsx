"use client";

import { useState } from "react";
import { FooterContent } from "@/types/database.types";
import { updateSiteContent } from "@/actions/content.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export default function FooterForm({ initialContent }: { initialContent: FooterContent }) {
  const [content, setContent] = useState<FooterContent>(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateSiteContent("footer", content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Footer content updated successfully");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    const newLinks = [...content.socialLinks];
    newLinks[index][field] = value;
    setContent({ ...content, socialLinks: newLinks });
  };

  const addSocialLink = () => {
    setContent({
      ...content,
      socialLinks: [...content.socialLinks, { platform: "New", url: "#" }]
    });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = content.socialLinks.filter((_, i) => i !== index);
    setContent({ ...content, socialLinks: newLinks });
  };

  const updateColumnLink = (colIndex: number, linkIndex: number, field: "name" | "href", value: string) => {
    const newCols = [...content.columns];
    newCols[colIndex].links[linkIndex][field] = value;
    setContent({ ...content, columns: newCols });
  };

  const addColumnLink = (colIndex: number) => {
    const newCols = [...content.columns];
    newCols[colIndex].links.push({ name: "New Link", href: "/" });
    setContent({ ...content, columns: newCols });
  };

  const removeColumnLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...content.columns];
    newCols[colIndex].links = newCols[colIndex].links.filter((_, i) => i !== linkIndex);
    setContent({ ...content, columns: newCols });
  };

  const updateColumnTitle = (colIndex: number, title: string) => {
    const newCols = [...content.columns];
    newCols[colIndex].title = title;
    setContent({ ...content, columns: newCols });
  };

  const addColumn = () => {
    setContent({
      ...content,
      columns: [...content.columns, { title: "New Column", links: [] }]
    });
  };

  const removeColumn = (colIndex: number) => {
    const newCols = content.columns.filter((_, i) => i !== colIndex);
    setContent({ ...content, columns: newCols });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Brand & Description</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Logo Text</label>
            <Input 
              value={content.logoText} 
              onChange={e => setContent({ ...content, logoText: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea 
              value={content.description} 
              onChange={e => setContent({ ...content, description: e.target.value })} 
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Support Email</label>
            <Input
              type="email"
              placeholder="hello@hamperly.com"
              value={content.contactEmail ?? ''}
              onChange={e => setContent({ ...content, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Support Phone</label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={content.contactPhone ?? ''}
              onChange={e => setContent({ ...content, contactPhone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Social Links</h3>
          <Button onClick={addSocialLink} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Social
          </Button>
        </div>
        <div className="space-y-4">
          {content.socialLinks.map((link, i) => (
            <div key={i} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Platform (e.g. IG, FB)</label>
                <Input value={link.platform} onChange={e => updateSocialLink(i, "platform", e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input value={link.url} onChange={e => updateSocialLink(i, "url", e.target.value)} />
              </div>
              <Button variant="destructive" size="icon" onClick={() => removeSocialLink(i)}>
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Link Columns</h3>
          <Button onClick={addColumn} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Column
          </Button>
        </div>
        <div className="space-y-6">
          {content.columns.map((col, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Column Title</label>
                  <Input value={col.title} onChange={e => updateColumnTitle(i, e.target.value)} />
                </div>
                <Button variant="destructive" size="icon" onClick={() => removeColumn(i)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>

              <div className="pl-6 border-l-2 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">Links</h4>
                  <Button onClick={() => addColumnLink(i)} variant="secondary" size="sm">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {col.links.map((link, j) => (
                  <div key={j} className="flex gap-4 items-end bg-white p-3 rounded border">
                    <div className="flex-1">
                      <Input placeholder="Name" value={link.name} onChange={e => updateColumnLink(i, j, "name", e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <Input placeholder="URL" value={link.href} onChange={e => updateColumnLink(i, j, "href", e.target.value)} />
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeColumnLink(i, j)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving..." : "Save Footer Content"}
      </Button>
    </div>
  );
}
