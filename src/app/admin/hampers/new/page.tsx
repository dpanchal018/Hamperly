import { HamperForm } from '@/components/admin/HamperForm';

export default function NewHamperPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Hamper</h1>
        <p className="text-slate-500 mt-1">Create a new pre-made hamper bundle.</p>
      </div>
      
      <HamperForm />
    </div>
  );
}
