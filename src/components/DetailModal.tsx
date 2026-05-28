import React from 'react';
import { PenerimaHuntap } from '../types';
import { X, Phone, Compass, FileText, Home, Award, Calendar } from 'lucide-react';

interface DetailModalProps {
  item: PenerimaHuntap | null;
  onClose: () => void;
}

export default function DetailModal({ item, onClose }: DetailModalProps) {
  if (!item) return null;

  const isSudah = item.terimaSertipikat === 'Sudah';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in">
      {/* Absolute click-outside listener background */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Sheet panel body container */}
      <div className="relative bg-slate-900 border-t md:border border-slate-800 w-full max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl p-4.5 space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-slide-up select-none">
        {/* Pull tab handle indicator (Mobile design focus) */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto md:hidden mb-1"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
              <Home className="w-4.5 h-4.5 text-teal-400" /> Detail Rumah {item.nomorRumah}
            </h3>
            <p className="text-slate-400 text-[10px]">Informasi lengkap kepemilikan & fisik unit.</p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 text-slate-400 hover:text-slate-200 p-2 rounded-full border border-slate-750 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary credentials header card */}
        <div className="bg-slate-850 border border-slate-750/75 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Kepala Keluarga</span>
              <h4 className="text-sm font-extrabold text-slate-200">{item.nama}</h4>
            </div>
            <span
              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                isSudah
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
              }`}
            >
              {isSudah ? '✅ Sudah SHM' : '⏳ Belum SHM'}
            </span>
          </div>

          <div className="flex gap-2.5 items-center text-xs text-slate-400 pt-1.5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 font-bold">
              <Compass className="w-4 h-4 text-slate-500" />
              <span className="text-teal-400 font-mono font-black">{item.koordinat || 'Tidak ada koordinat'}</span>
            </div>
          </div>
        </div>

        {/* Structured table list specifications */}
        <div className="space-y-2.5 text-xs">
          {[
            { icon: <MapPinIcon />, label: 'Kecamatan', value: item.kecamatan },
            { icon: <MapPinIcon />, label: 'Desas / Kelurahan', value: item.desa },
            { icon: <BriefcaseIcon />, label: 'Luas Tanah', value: item.luas ? `${item.luas} m²` : '-' },
            { icon: <FileText className="w-4 h-4 text-slate-500" />, label: 'Dokumen Asal', value: item.dokumenTanah || '-' },
            {
              icon: <Phone className="w-4 h-4 text-slate-500" />,
              label: 'No. Handphone',
              value: item.noHp ? (
                <a
                  href={`tel:${item.noHp}`}
                  className="text-teal-400 hover:underline flex items-center gap-1 font-bold font-mono"
                >
                  {item.noHp} <span className="text-[9px] font-medium bg-teal-500/10 px-1 py-0.2 rounded">Hubungi</span>
                </a>
              ) : (
                '-'
              ),
            },
          ].map((row, idx) => (
            <div
              key={idx}
              className="flex justify-between items-start py-2 border-b border-slate-800/60 font-semibold"
            >
              <span className="flex items-center gap-2 text-slate-400">
                {row.icon}
                <span>{row.label}</span>
              </span>
              <span className="text-slate-200 text-right max-w-[190px] break-all">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Keterangan */}
        {item.keterangan && (
          <div className="bg-slate-850/50 p-3 rounded-2xl border border-slate-800 text-[11px] leading-relaxed">
            <span className="block font-bold text-slate-400 uppercase tracking-wide text-[9px] mb-1">
              Catatan Lapangan :
            </span>
            <p className="text-slate-300 font-semibold">{item.keterangan}</p>
          </div>
        )}

        {/* Image Attachment panels with lightbox opening */}
        <div className="space-y-3.5 pt-2 border-t border-slate-850">
          <h4 className="text-xs font-bold text-slate-300 uppercase">Lampiran & Foto Fisik</h4>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Foto Rumah', url: item.fotoRumah },
              { label: 'Foto KTP / KK', url: item.fotoKtpKk },
              { label: 'Dokumen Tanah', url: item.fotoDokTanah },
              { label: 'Sertipikat SHM', url: item.fotoShm },
            ].map((pic, idx) => {
              if (!pic.url) return null;
              return (
                <div
                  key={idx}
                  className="bg-slate-850 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-2 hover:border-slate-700 select-none group"
                >
                  <img
                    src={pic.url}
                    alt={pic.label}
                    className="w-full h-24 rounded-lg object-cover cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-300"
                    onClick={() => window.open(pic.url)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=150&q=50';
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">
                    {pic.label}
                  </span>
                </div>
              );
            })}
          </div>

          {[item.fotoRumah, item.fotoKtpKk, item.fotoDokTanah, item.fotoShm].filter(Boolean).length === 0 && (
            <p className="text-center text-[11px] text-slate-500 py-2.5">Belum ada lampiran fisik.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon micro helpers
function MapPinIcon() {
  return (
    <span className="w-4 h-4 text-slate-500 flex items-center justify-center text-[10px] border border-slate-755 rounded-sm leading-none font-bold">
      L
    </span>
  );
}
function BriefcaseIcon() {
  return (
    <span className="w-4 h-4 text-slate-500 flex items-center justify-center text-[10px] border border-slate-755 rounded-sm leading-none font-bold">
      M
    </span>
  );
}
