"use client";

import { useState } from "react";
import { HeaderContent } from "@/types/database.types";
import { updateSiteContent } from "@/actions/content.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export default function HeaderForm({ initialContent }: { initialContent: HeaderContent }) {
  const [content, setContent] = useState<HeaderContent>(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateSiteContent("header", content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Header content updated successfully");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNavLink = (index: number, field: "name" | "href", value: string) => {
    const newLinks = [...content.navLinks];
    newLinks[index][field] = value;
    setContent({ ...content, navLinks: newLinks });
  };

  const addNavLink = () => {
    setContent({
      ...content,
      navLinks: [...content.navLinks, { name: "New Link", href: "/" }]
    });
  };

  const removeNavLink = (index: number) => {
    const newLinks = content.navLinks.filter((_, i) => i !== index);
    setContent({ ...content, navLinks: newLinks });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Logo</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Logo Text</label>
          <Input 
            value={content.logoText} 
            onChange={e => setContent({ ...content, logoText: e.target.value })} 
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Navigation Links</h3>
          <Button onClick={addNavLink} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        </div>
        
        <div className="space-y-4">
          {content.navLinks.map((link, i) => (
            <div key={i} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={link.name} onChange={e => updateNavLink(i, "name", e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">URL / Href</label>
                <Input value={link.href} onChange={e => updateNavLink(i, "href", e.target.value)} />
              </div>
              <Button variant="destructive" size="icon" onClick={() => removeNavLink(i)}>
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Saving..." : "Save Header Content"}
      </Button>
    </div>
  );
}
