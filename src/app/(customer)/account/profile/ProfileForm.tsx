"use client";

import { useState, useEffect, useRef } from "react";
import { updateCustomerProfile } from "@/actions/customer.actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ProfileForm({ initialName, initialPhone }: { initialName: string, initialPhone: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateCustomerProfile(formData);

    if (!result.success) {
      setError(result.error || "An error occurred");
    } else {
      setSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Profile updated successfully!
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          defaultValue={initialName}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          defaultValue={initialPhone}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none"
          placeholder="+91 98765 43210"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-3 h-12 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-200 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving Changes...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
