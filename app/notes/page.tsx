
import { createServerClient } from '@/utils/supabase/server';
import React from 'react';

/**
 * Notes Page - Server Component
 * Fetches data from the Supabase 'notes' table and renders it.
 */
export default async function Notes() {
  const supabase = await createServerClient();
  
  // Select all rows from the 'notes' table
  const { data: notes, error } = await supabase.from('notes').select('*');

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-red-600 font-bold">Error loading notes</h1>
        <p className="text-slate-500 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Notes</h1>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto shadow-inner">
          <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
            {JSON.stringify(notes, null, 2)}
          </pre>
        </div>
        
        <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          Data Streamed Directly from Supabase Cloud
        </p>
      </div>
    </div>
  );
}
