import React from 'react';

interface SmartphoneShellProps {
  children: React.ReactNode;
  currentUser?: string;
  onChangeUser?: (user: string) => void;
}

export default function SmartphoneShell({
  children,
}: SmartphoneShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300">
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
