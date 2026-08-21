import { PurchaseForm } from '@/components/admin/PurchaseForm';

export default function NewPurchasePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Record New Purchase</h1>
        <p className="text-slate-500 mt-1">Create a customer profile and record their manual purchase.</p>
      </div>
      
      <PurchaseForm />
    </div>
  );
}
