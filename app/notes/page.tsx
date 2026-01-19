
import { createServerClient } from '@/utils/supabase/server';
import React from 'react';

/**
 * Cloud Database Monitor
 * Specifically designed to fetch data from the 'Cashwrap-Receipt' table.
 */
export default async function Notes() {
  const supabase = await createServerClient();
  
  // Querying the table name as confirmed by the user
  const { data: receipts, error } = await supabase
    .from('Cashwrap-Receipt')
    .select('*');

  // Error Handling (Commonly triggered by missing RLS policies)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-red-100">
          <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Supabase Sync Error</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            The request to <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">Cashwrap-Receipt</code> failed. This usually happens if the table doesn't exist or RLS is blocking access.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-[10px] text-slate-400 mb-6">
            Error: {error.message}
          </div>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">1</div>
              <p className="text-[11px] text-slate-600">Ensure <b>RLS</b> is enabled on the table.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
              <p className="text-[11px] text-slate-600">Add a Policy: <b>Enable read access for all users</b>.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supabase Cloud • Production</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Table: <span className="text-indigo-600 italic">Cashwrap-Receipt</span>
            </h1>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
               <p className="text-[9px] font-bold text-slate-400 uppercase">Records Fetched</p>
               <p className="text-xl font-black text-slate-900">{receipts?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Data Inspector */}
        <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl shadow-indigo-200/20">
          <div className="bg-[#0F172A] rounded-[2rem] p-6 md:p-10 border border-slate-800">
            {/* Terminal Mockup Header */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-4">
                <span>SELECT * FROM "Cashwrap-Receipt"</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">UTF-8</span>
              </div>
            </div>

            {/* JSON Content */}
            <div className="overflow-x-auto custom-scrollbar">
              {receipts && receipts.length > 0 ? (
                <pre className="text-indigo-300 font-mono text-sm md:text-base leading-relaxed selection:bg-indigo-500/30">
                  {JSON.stringify(receipts, null, 2)}
                </pre>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="text-slate-700">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <p className="text-slate-500 font-mono text-sm">Table returned 0 rows.</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-2 font-bold">Query successful, but no data exists.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Enterprise Logistics Protocol v1.0.4
          </p>
          <div className="flex gap-6">
            <a href="https://supabase.com/dashboard" target="_blank" className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Supabase Dashboard
            </a>
            <a href="https://vercel.com" target="_blank" className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-slate-800 transition-colors">
              Vercel Deployment
            </a>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0F172A;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1E293B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
}
