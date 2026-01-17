
'use client';

import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Cashwrap Receipt Monitoring</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.username}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role === UserRole.ADMIN ? 'Administrator' : user.branchName}</p>
        </div>
        <button 
          onClick={onLogout}
          className="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
