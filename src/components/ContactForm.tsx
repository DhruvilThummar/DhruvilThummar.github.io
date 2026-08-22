'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from './ui/Button';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
          Thank you for your message! D R Thummar will get back to you shortly.
        </div>
      )}
      <div>
        <label className="block text-xs font-mono text-slate-600 mb-1">YOUR NAME</label>
        <input
          type="text"
          required
          placeholder="John Doe"
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-slate-600 mb-1">YOUR EMAIL</label>
        <input
          type="email"
          required
          placeholder="john@example.com"
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-slate-600 mb-1">MESSAGE</label>
        <textarea
          rows={4}
          required
          placeholder="Describe your project or inquiry..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <Button variant="primary" size="lg" className="w-full">
        Send Message <Mail className="w-4 h-4" />
      </Button>
    </form>
  );
}

export default ContactForm;
