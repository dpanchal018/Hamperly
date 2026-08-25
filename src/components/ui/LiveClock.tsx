"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setDate(new Date());
    
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);

  if (!mounted || !date) {
    return <div className="h-6"></div>; // Placeholder to prevent layout shift
  }

  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center text-slate-500 text-sm font-medium bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
      <Clock className="w-4 h-4 mr-2 text-indigo-500" />
      <span>{formattedDate}</span>
      <span className="mx-2 text-slate-300">|</span>
      <span className="text-slate-700 font-bold tracking-tight">{formattedTime}</span>
    </div>
  );
}
