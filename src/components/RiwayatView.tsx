import React, { useState } from 'react';
import { UserLog } from '../types';
import { Clock, History, AlertTriangle, Key, Search, Database, Trash2 } from 'lucide-react';

interface RiwayatViewProps {
  logs: UserLog[];
  onClearLogs?: () => void;
  onDeleteLog?: (id: string) => void;
  currentUser?: string;
}

const getInitials = (name: string) => {
  if (!name) return 'PT';
  const clean = name.includes('@') ? name.split('@')[0] : name;
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (clean.length > 1) {
    return (clean[0] + clean[1]).toUpperCase();
  }
  return clean.toUpperCase();
};

export default function RiwayatView({ logs, onClearLogs, onDeleteLog, currentUser }: RiwayatViewProps) {
  const [logSearch, setLogSearch] = useState('');

  // Sorter logs by latest timestamp
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
  );

  const filteredLogs = sortedLogs.filter((log) => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return (
      log.user?.toLowerCase().includes(q) ||
      log.aksi?.toLowerCase().includes(q) ||
      log.detail?.toLowerCase().includes(q)
    );
  });

  const getLogStampColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('hapus') || act.includes('delete')) return 'border-rose-500 bg-rose-500/10 text-rose-400';
    if (act.includes('tambah') || act.includes('add') || act.includes('import'))
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    if (act.includes('edit') || act.includes('ubah'))
      return 'border-amber-500 bg-amber-500/10 text-amber-500';
    if (act.includes('login')) return 'border-indigo-500 bg-indigo-500/10 text-indigo-400';
    return 'border-teal-500 bg-teal-500/10 text-teal-400';
  };

  const getLogBulletIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login')) return <Key className="w-3.5 h-3.5 text-indigo-400" />;
    if (act.includes('hapus')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    return <Database className="w-3.5 h-3.5 text-slate-300" />;
  };

  // Convert GMT/UTC ISO timestamp into WITA (Bima local time, GMT+8)
  const formatWITA = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' WITA';
    } catch (err) {
      return isoStr;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5 animate-pulse">
            <History className="w-5 h-5 text-amber-400" /> Log Aktivitas Petugas
          </h2>
          <p className="text-slate-400 text-xs">Riwayat audit manipulasi data secara real-time.</p>
        </div>
        {onClearLogs && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[9px] font-black text-rose-400 border border-rose-500/20 px-2.5 py-1 bg-rose-500/5 rounded-lg cursor-pointer hover:bg-rose-500/10 transition"
          >
            Bersihkan Log
          </button>
        )}
      </div>

      {/* Log specific Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
        <input
          type="text"
          value={logSearch}
          onChange={(e) => setLogSearch(e.target.value)}
          placeholder="Cari kata kunci dalam log aktivitas..."
          className="bg-slate-800 border border-slate-750 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full"
        />
      </div>

      {/* Vertical Timeline Feed */}
      <div className="relative border-l-2 border-slate-800 ml-3.5 pl-5.5 space-y-5 py-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8 ml-[-14px]">
            <p>Tidak ada riwayat log yang sesuai.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Colored Badge Timeline Bullet */}
              <div
                className={`absolute left-[-33.5px] top-1 border-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md shrink-0 ${getLogStampColor(
                  log.aksi
                )}`}
              >
                {getLogBulletIcon(log.aksi)}
              </div>

              {/* Log block */}
              <div className="bg-slate-800/80 border border-slate-750/70 rounded-2xl p-3.5 space-y-1.5 shadow-sm hover:border-slate-700 transition">
                <div className="flex justify-between items-center text-2xs">
                  <span className="font-extrabold text-blue-400">
                    {log.user === 'admin' || log.user === 'Tamu' ? log.user : getInitials(log.user)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" /> {formatWITA(log.waktu)}
                    </span>
                    {onDeleteLog && (
                      <button
                        onClick={() => {
                          if (currentUser !== 'admin') {
                            alert('Akses Ditolak! Hanya akun Administrator yang bisa menghapus log.');
                            return;
                          }
                          if (confirm('Hapus item log aktivitas ini dari database secara permanen?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 p-0.5 rounded cursor-pointer transition ml-1"
                        title="Hapus Log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-300">
                    {log.aksi}
                  </span>
                </div>

                <p className="text-2xs text-slate-300 leading-relaxed font-medium">{log.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
