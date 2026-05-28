import React from 'react';
import { PenerimaHuntap } from '../types';
import { Award, Clock, Home, FileText, ChevronRight, TrendingUp, RefreshCw } from 'lucide-react';

interface DashboardViewProps {
  data: PenerimaHuntap[];
  onQuickFilter: (key: string, value: string) => void;
  onSeed?: () => void;
  seeding?: boolean;
}

export default function DashboardView({ data, onQuickFilter, onSeed, seeding }: DashboardViewProps) {
  const total = data.length;
  const sudah = data.filter((item) => item.terimaSertipikat === 'Sudah').length;
  const belum = total - sudah;
  const persenSudah = total > 0 ? Math.round((sudah / total) * 100) : 0;

  // Group by Kecamatan (Top 5)
  const kecCounts: Record<string, number> = {};
  data.forEach((item) => {
    if (item.kecamatan) {
      kecCounts[item.kecamatan] = (kecCounts[item.kecamatan] || 0) + 1;
    }
  });
  const topKecamatan = Object.entries(kecCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxKecCount = topKecamatan.length > 0 ? Math.max(...topKecamatan.map(([, count]) => count)) : 1;

  // Group by Blocks (A, B, C, D, E, etc.)
  const blockMap: Record<string, { total: number; sudah: number }> = {};
  data.forEach((item) => {
    const blockMatch = item.nomorRumah?.match(/^([A-Z0-9]+)\./);
    const block = blockMatch ? blockMatch[1] : 'Lainnya';
    if (!blockMap[block]) {
      blockMap[block] = { total: 0, sudah: 0 };
    }
    blockMap[block].total += 1;
    if (item.terimaSertipikat === 'Sudah') {
      blockMap[block].sudah += 1;
    }
  });
  const blockList = Object.entries(blockMap).sort((a, b) => a[0].localeCompare(b[0]));

  // Document types breakdown
  const docCounts: Record<string, number> = {};
  data.forEach((item) => {
    const doc = item.dokumenTanah?.trim() || 'Tidak Ada Dokumen';
    docCounts[doc] = (docCounts[doc] || 0) + 1;
  });
  const docEntries = Object.entries(docCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 space-y-5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-20px] opacity-10">
          <Home className="w-40 h-40" />
        </div>
        <span className="text-[11px] uppercase tracking-wider font-extrabold bg-white/20 px-2.5 py-1 rounded-full inline-block mb-1.5">
          Live Monitor
        </span>
        <h2 className="text-xl font-extrabold leading-tight">Pendataan & Sertipikasi Huntap</h2>
        <p className="text-sm text-white/80 mt-1 max-w-[240px]">
          Sistem pemonitoran digital kepemilikan Sertipikat SHM Huntap Kabupaten Bima.
        </p>
      </div>

      {data.length === 0 && onSeed && (
        <div className="bg-slate-800 border border-teal-500/30 p-4 rounded-2xl shadow-md space-y-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <p className="text-xs text-teal-400 font-extrabold uppercase tracking-wide">Database Firestore Kosong</p>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
            Porting data online dari Firestore aktif! Namun database Anda saat ini belum memiliki records penerima. Klik tombol di bawah untuk mengupload seluruh data demo awal Huntap Bima.
          </p>
          <button
            onClick={onSeed}
            disabled={seeding}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mengupload ke Firestore...
              </>
            ) : (
              '⚡ Upload Data Demo ke Firestore'
            )}
          </button>
        </div>
      )}

      {/* Primary KPI Stats Row (Horizontal Grid / Flex) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Telah Bersertipikat Card */}
        <button
          onClick={() => onQuickFilter('terimaSertipikat', 'Sudah')}
          className="bg-slate-800 border border-slate-750/70 p-3.5 rounded-2xl text-left shadow-md hover:border-emerald-500 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 p-1.5 rounded-xl group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <p className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">Telah SHM</p>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">{sudah}</h3>
          <span className="text-xs text-slate-400 font-bold block mt-1">
            {persenSudah}% dari total unit
          </span>
        </button>

        {/* Belum Bersertipikat Card */}
        <button
          onClick={() => onQuickFilter('terimaSertipikat', 'Belum')}
          className="bg-slate-800 border border-slate-750/70 p-3.5 rounded-2xl text-left shadow-md hover:border-amber-500 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 bg-amber-500/10 text-amber-400 p-1.5 rounded-xl group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">Belum SHM</p>
          <h3 className="text-3xl font-black text-amber-500 mt-2">{belum}</h3>
          <span className="text-xs text-slate-400 font-bold block mt-1">
            {total - sudah} KK menanti sertifikasi
          </span>
        </button>
      </div>

      {/* Master Summary Card */}
      <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 text-teal-400 p-3 rounded-2xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Total Database</p>
            <h4 className="text-2xl font-black text-slate-100">{total} Unit KK</h4>
          </div>
        </div>
        <button
          onClick={() => onQuickFilter('', '')}
          className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
        >
          Lihat Data <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Pie SVG & Certificate Metrics */}
      <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl shadow-md">
        <h3 className="text-base font-extrabold text-slate-200 mb-3.5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Progres Sertifikasi SHM
        </h3>

        <div className="flex items-center justify-between gap-4">
          {/* Custom SVG Ring Progress Chart */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="45"
                className="stroke-slate-700"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="45"
                className="stroke-emerald-500 transition-all duration-1000"
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - persenSudah / 100)}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-100">{persenSudah}%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Lengkap</span>
            </div>
          </div>

          {/* Side metrics legends list */}
          <div className="flex-1 space-y-2.5">
            <div className="text-sm">
              <div className="flex justify-between font-extrabold text-slate-200 mb-1">
                <span>Sudah Menerima</span>
                <span className="text-emerald-400">{sudah} KK</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${persenSudah}%` }}></div>
              </div>
            </div>

            <div className="text-sm">
              <div className="flex justify-between font-extrabold text-slate-200 mb-1">
                <span>Belum Menerima</span>
                <span className="text-amber-500">{belum} KK</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${100 - persenSudah}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Area Kecamatan Chart */}
      <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl shadow-md">
        <h3 className="text-base font-extrabold text-slate-200 mb-4 flex items-center gap-2">
          <Home className="w-4 h-4 text-teal-400" /> Distribusi Kecamatan Teratas
        </h3>

        {topKecamatan.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">Belum ada sebaran wilayah.</p>
        ) : (
          <div className="space-y-3">
            {topKecamatan.map(([kec, count]) => {
              const widthPerc = Math.max(8, (count / maxKecCount) * 100);
              return (
                <div key={kec} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-extrabold text-slate-200">
                    <span>Kecamatan {kec}</span>
                    <span className="text-teal-400 font-black">{count} KK</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${widthPerc}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Certification Stack Matrix */}
      <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl shadow-md">
        <h3 className="text-base font-extrabold text-slate-200 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" /> Analisis Blok Per Rumah
        </h3>

        {blockList.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-4">Belum ada blok teridentifikasi.</p>
        ) : (
          <div className="space-y-3">
            {blockList.map(([block, info]) => {
              const sudahPerc = (info.sudah / info.total) * 100;
              return (
                <div key={block} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-black text-slate-300">Blok {block}</span>
                  <div className="flex-1 bg-slate-700 h-3.5 rounded-lg overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full text-[9px] font-bold text-slate-900 flex items-center justify-center transition-all duration-700"
                      style={{ width: `${sudahPerc}%` }}
                      title={`Sudah SHM: ${info.sudah}`}
                    >
                      {info.sudah > 0 && `${Math.round(sudahPerc)}%`}
                    </div>
                    <div
                      className="bg-amber-500 h-full text-[9px] font-bold text-slate-900 flex items-center justify-center transition-all duration-700"
                      style={{ width: `${100 - sudahPerc}%` }}
                      title={`Belum SHM: ${info.total - info.sudah}`}
                    >
                      {info.total - info.sudah > 0 && `${Math.round(100 - sudahPerc)}%`}
                    </div>
                  </div>
                  <span className="text-sm text-slate-300 font-extrabold w-12 text-right">
                    {info.total} KK
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Types Deck */}
      <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl shadow-md">
        <h3 className="text-base font-extrabold text-slate-200 mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" /> Ringkasan Dokumen Tanah Asal
        </h3>
        <p className="text-xs text-slate-400 mb-3 text-left">Klik jenis dokumen di bawah untuk memfilter data rekap.</p>
 
        <div className="space-y-2">
          {docEntries.map(([doc, val]) => (
            <button
              key={doc}
              onClick={() => onQuickFilter('dokumenTanah', doc)}
              className="w-full bg-slate-850 hover:bg-slate-750 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-200 flex items-center justify-between transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <FileText className="w-4 h-4 text-indigo-400" shrink-0="true" />
                <span className="text-left">{doc}</span>
              </div>
              <span className="bg-indigo-500/25 text-indigo-300 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                {val} UNIT
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center pt-4 pb-2 border-t border-slate-800/40">
        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase select-none">
          Dibuat oleh ianz
        </p>
      </div>
    </div>
  );
}
