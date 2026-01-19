
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type TableOption = 'Cashwrap-Receipt' | 'Supplier-Orders' | 'Billing-Records' | 'Logistics-Tracking' | 'Warehouse-Inventory' | 'User-Accounts';

export default function CloudMonitor() {
  const [activeTable, setActiveTable] = useState<TableOption>('Cashwrap-Receipt');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: fetchError } = await supabase
          .from(activeTable)
          .select('*');
        
        if (fetchError) {
          setError(fetchError.message);
          setData([]);
        } else {
          setData(result || []);
        }
      } catch (err) {
        setError('Unexpected connection error.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTable]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Inspector</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Table: <span className="text-indigo-600 italic">{activeTable}</span>
            </h1>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
            {(['Cashwrap-Receipt', 'Supplier-Orders', 'Billing-Records', 'Logistics-Tracking', 'Warehouse-Inventory', 'User-Accounts'] as TableOption[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTable(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  activeTable === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-[2rem] p-10 text-center">
            <div className="bg-red-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-lg font-black text-red-900 uppercase">Table Error</h2>
            <p className="text-red-600/70 text-sm mt-2 font-medium italic">"{error}"</p>
            <div className="mt-6 text-[11px] text-red-400 uppercase font-bold tracking-widest leading-loose bg-white/50 p-4 rounded-xl inline-block text-left">
               Checklist for <span className="font-black underline">{activeTable}</span>:<br/>
              1. Create table in Supabase Dashboard<br/>
              2. Add columns corresponding to your logic<br/>
              3. Enable RLS Policy: "Enable Read for all"
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
            <div className="bg-[#0F172A] rounded-[2rem] p-6 md:p-10 border border-slate-800">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  {loading ? 'Executing Query...' : `${data.length} Records Found`}
                </div>
              </div>

              <div className="overflow-x-auto">
                <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
                  {loading ? '// Initializing cloud handshake...' : JSON.stringify(data, null, 2)}
                </pre>
                {!loading && data.length === 0 && (
                  <div className="py-12 text-center text-slate-600 italic text-sm">
                    No records found in {activeTable}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
