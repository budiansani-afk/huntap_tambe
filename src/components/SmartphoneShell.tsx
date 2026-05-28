import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, Battery, Radio, Compass, RefreshCw } from 'lucide-react';

interface SmartphoneShellProps {
  children: React.ReactNode;
  currentUser: string;
  onChangeUser: (user: string) => void;
}

export default function SmartphoneShell({
  children,
  currentUser,
  onChangeUser,
}: SmartphoneShellProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300">
      {/* Top Floating Admin Settings Bar for simulation (Desktop only) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-sm mb-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-xs text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> Sandbox Live
        </span>
        <div className="flex items-center gap-2">
          <span>Akses:</span>
          <select
            value={currentUser}
            onChange={(e) => onChangeUser(e.target.value)}
            className="bg-slate-850 text-slate-200 border border-slate-750 rounded px-1.5 py-0.5 outline-none font-bold cursor-pointer hover:border-emerald-500 transition-all"
          >
            <option value="Tamu">Tamu (Read-Only)</option>
            <option value="budiansani@gmail.com">budiansani@gmail.com (Petugas)</option>
            <option value="admin">admin (Administrator)</option>
          </select>
        </div>
      </div>

      {/* Main SmartPhone Frame Container */}
      <div className="relative w-full md:w-[410px] h-screen md:h-[840px] bg-slate-900 md:rounded-[48px] md:border-[12px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Phone Notch/Dynamic Island (Desktop only) */}
        <div className="hidden md:block absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-6.5 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-850 absolute left-4.5"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900 absolute right-6"></div>
          <div className="w-10 h-1 bg-slate-900 rounded-full"></div>
        </div>

        {/* App Workspace Contents */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 select-none relative w-full h-full">
          {children}
        </div>

        {/* Phone Home Swipe Bar Indicator (Desktop only) */}
        <div className="hidden md:block absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-40 shrink-0"></div>
      </div>

      {/* Mobile Footer Meta */}
      <p className="text-slate-600 text-[11px] mt-3 hidden md:block">
        Huntap Bima Mobile • Click anywhere or rotate screens to test scaling.
      </p>
    </div>
  );
}
