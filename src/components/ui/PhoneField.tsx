'use client';

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneFieldProps {
  value: string;
  onChange: (value: string | undefined) => void;
  error?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
}

export function PhoneField({ 
  value, 
  onChange, 
  error, 
  required = false, 
  placeholder = "Enter phone number", 
  id, 
  name,
  className = "" 
}: PhoneFieldProps) {
  return (
    <div className={`phone-field-wrapper ${error ? 'is-error' : ''} ${className}`}>
      <PhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={onChange}
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all ${
          error 
            ? 'border border-red-300 ring-2 ring-red-100 bg-red-50/10' 
            : 'border border-slate-200'
        }`}
        style={{
          // We apply the tailwind classes via the wrapper and override some default lib styles here
          '--PhoneInput-color--focus': 'transparent',
          '--PhoneInputCountryFlag-borderColor': 'transparent',
        } as React.CSSProperties}
      />
      <style jsx global>{`
        .phone-field-wrapper .PhoneInput {
          padding: 0.5rem 1rem;
          min-height: 3rem; /* 48px to match our standard h-12 inputs */
        }
        .phone-field-wrapper .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 1rem;
          width: 100%;
          color: inherit;
        }
        .phone-field-wrapper .PhoneInputCountry {
          margin-right: 0.75rem;
          padding-right: 0.75rem;
          border-right: 1px solid #e2e8f0;
        }
        .phone-field-wrapper .PhoneInputCountrySelect {
          /* Add some styling to the select to make it look nicer if needed */
        }
      `}</style>
    </div>
  );
}
