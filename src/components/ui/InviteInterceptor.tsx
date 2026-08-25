"use client";

import { useEffect } from 'react';

export function InviteInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('access_token=') && (hash.includes('type=invite') || hash.includes('type=recovery'))) {
        window.location.replace('/update-password' + hash);
      }
    }
  }, []);

  return null;
}
