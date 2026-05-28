import React, { useState } from 'react';
import { PenerimaHuntap } from '../types';
import { DATA_WILAYAH } from '../data';
import {
  Search,
  Filter,
  Download,
  Phone,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Award,
} from 'lucide-react';

interface RekapViewProps {
  data: PenerimaHuntap[];
  onEdit: (item: PenerimaHuntap) => void;
  onDelete: (id: string) => void;
  onViewMap: (id: string) => void;
  onSelectDetail: (item: PenerimaHuntap) => void;
  initialFilterField: string;
  initialFilterValue: string;
  currentUser: string;
}

export default function RekapView({
  data,
  onEdit,
  onDelete,
  onViewMap,
  onSelectDetail,
  initialFilterField,
  initialFilterValue,
  currentUser,
}: RekapViewProps) {
  // Filters
  const [filterKec, setFilterKec] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [filterStatus, setFilterStatus] = useState(
    initialFilterField === 'terimaSertipikat' ? initialFilterValue : ''
  );
  const [filterBlock, setFilterBlock] = useState('');
  const [searchText, setSearchText] = useState(
    initialFilterField === 'dokumenTanah' ? initialFilterValue : ''
  );

  // Card expanded items
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derived filter options
  const kecSet = new Set(data.map((item) => item.kecamatan).filter(Boolean));
  const desSet = new Set(data.map((item) => item.desa).filter(Boolean));

  // Filter application
  const filteredData = data.filter((item) => {
    const blockMatch = item.nomorRumah?.match(/^([A-Z0-9]+)\./);
    const itemBlock = blockMatch ? blockMatch[1] : '';

    if (filterKec && item.kecamatan !== filterKec) return false;
    if (filterDesa && item.desa !== filterDesa) return false;
    if (filterStatus && item.terimaSertipikat !== filterStatus) return false;
    if (filterBlock && itemBlock !== filterBlock) return false;

    if (searchText) {
      const q = searchText.toLowerCase();
      const matchName = item.nama?.toLowerCase().includes(q);
      const matchNo = item.nomorRumah?.toLowerCase().includes(q);
      const matchDok = item.dokumenTanah?.toLowerCase().includes(q);
      return matchName || matchNo || matchDok;
    }

    return true;
  });

  const totalFiltered = filteredData.length;
  const totalSudah = filteredData.filter((item) => item.terimaSertipikat === 'Sudah').length;
  const totalBelum = totalFiltered - totalSudah;

  const handleResetFilters = () => {
    setFilterKec('');
    setFilterDesa('');
    setFilterStatus('');
    setFilterBlock('');
    setSearchText('');
  };

  // Plain Text formatted spreadsheet generation for rapid, reliable exports
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data yang dapat diunduh.');
      return;
    }
    const headers = [
      'Nomor Rumah',
      'Nama Kepala Keluarga',
      'Kecamatan Asal',
      'Desa Asal',
      'Luas Tanah (m2)',
      'Dokumen Tanah Asal',
      'Status Sertipikat Huntap',
      'Nomor Handphone',
      'Titik Koordinat',
      'Catatan Keterangan',
    ];

    const rows = filteredData.map((item) => [
      `"${item.nomorRumah}"`,
      `"${item.nama}"`,
      `"${item.kecamatan}"`,
      `"${item.desa}"`,
      item.luas ?? '',
      `"${item.dokumenTanah}"`,
      `"${item.terimaSertipikat}"`,
      `"${item.noHp}"`,
      `"${item.koordinat}"`,
      `"${item.keterangan}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Huntap_Bima_Excel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar & Primary Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-black text-slate-100 flex items-center gap-1.5">
          <FileSpreadsheet className="w-5 h-5 text-teal-400" /> Rekapitulasi & Filter
        </h2>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cari Nama / No Rumah / Dokumen..."
            className="bg-slate-800 border border-slate-750 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full font-bold"
          />
        </div>
      </div>

      {/* Advanced Filter Collapsible form */}
      <div className="bg-slate-800 border border-slate-750/70 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex justify-between items-center text-xs font-black text-slate-350 uppercase tracking-wider">
          <span className="flex items-center gap-1 text-teal-400">
            <Filter className="w-3.5 h-3.5 text-teal-400" /> Filter Sebaran
          </span>
          <button onClick={handleResetFilters} className="text-rose-400 hover:text-teal-300 font-extrabold text-xs">
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Kecamatan Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Kecamatan</label>
            <select
              value={filterKec}
              onChange={(e) => {
                setFilterKec(e.target.value);
                setFilterDesa('');
              }}
              className="bg-slate-850 border border-slate-700/60 rounded-lg px-2 py-2 text-xs font-bold text-slate-200 w-full cursor-pointer outline-none"
            >
              <option value="">Semua</option>
              {[...kecSet].sort().map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Desa Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Desa</label>
            <select
              value={filterDesa}
              disabled={!filterKec}
              onChange={(e) => setFilterDesa(e.target.value)}
              className="bg-slate-850 border border-slate-700/60 rounded-lg px-2 py-2 text-xs font-bold text-slate-200 w-full cursor-pointer disabled:opacity-40 outline-none"
            >
              <option value="">Semua</option>
              {filterKec &&
                DATA_WILAYAH[filterKec]?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Sertifikasi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-850 border border-slate-700/60 rounded-lg px-2 py-2 text-xs font-bold text-slate-200 w-full cursor-pointer outline-none"
            >
              <option value="">Semua</option>
              <option value="Sudah">Sudah SHM</option>
              <option value="Belum">Belum SHM</option>
            </select>
          </div>

          {/* Block Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Blok</label>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="bg-slate-850 border border-slate-700/60 rounded-lg px-2 py-2 text-xs font-bold text-slate-200 w-full cursor-pointer outline-none"
            >
              <option value="">Semua</option>
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((b) => (
                <option key={b} value={b}>
                  Blok {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CSV Exporter Trigger */}
        <button
          onClick={handleExportCSV}
          className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/15 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Ekspor Rekapan Excel (CSV)
        </button>
      </div>

      {/* Filter Metadata Header */}
      <div className="flex justify-between items-center text-sm font-black text-slate-350 px-1">
        <span className="text-emerald-400">
          Hasil Filter: <b className="text-emerald-400">{totalFiltered}</b> KK
        </span>
        <div className="flex gap-3 text-xs font-black">
          <span className="text-emerald-400">✅ {totalSudah} SHM</span>
          <span className="text-amber-500">⏳ {totalBelum} Belum</span>
        </div>
      </div>

      {/* Card lists designed especially for App-like mobile experience */}
      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">Tidak ada data yang cocok dengan kriteria filter.</p>
          </div>
        ) : (
          filteredData.map((item) => {
            const isSudah = item.terimaSertipikat === 'Sudah';
            const blockMatch = item.nomorRumah?.match(/^([A-Z0-9]+)\./);
            const block = blockMatch ? blockMatch[1] : '';
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-slate-800 border border-slate-750/70 rounded-2xl shadow-sm hover:border-slate-700 transition"
              >
                {/* Header card info */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Block/no badge styled cleanly */}
                    <div className="bg-slate-850 border border-slate-750 font-black text-base text-teal-400 w-14 h-14 rounded-14 flex flex-col items-center justify-center shrink-0 leading-tight">
                      <span className="text-[10px] uppercase text-slate-500 font-extrabold">No</span>
                      <span className="text-base font-black">{item.nomorRumah}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-100">{item.nama}</h4>
                      <p className="text-sm font-bold text-slate-300 mt-1">
                        {item.desa}, Kec. {item.kecamatan}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[12px] font-black px-3 py-1.5 rounded-full shadow-sm ${
                      isSudah
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                    }`}
                  >
                    {isSudah ? 'Sudah SHM' : 'Belum SHM'}
                  </span>
                </div>

                {/* Collapsible content (Expanded view) */}
                {isExpanded && (
                  <div className="border-t border-slate-750 px-4 py-3.5 bg-slate-850/40 space-y-3.5 text-xs leading-relaxed transition-all">
                    <div className="grid grid-cols-2 gap-y-3 text-sm border-b border-slate-750 pb-3.5">
                      <div>
                        <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wide">Luas Tanah</p>
                        <p className="text-slate-200 font-black text-base mt-1">{item.luas ? `${item.luas} m²` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wide">Kontak Pemilik</p>
                        <p className="text-slate-200 font-black text-base mt-1">{item.noHp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wide">Dokumen Asal</p>
                        <p className="text-slate-200 font-black text-base mt-1">{item.dokumenTanah || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wide">GPS Koordinat</p>
                        <p className="text-teal-400 font-mono font-black text-sm leading-none mt-1.5">{item.koordinat || '-'}</p>
                      </div>
                    </div>

                    {item.keterangan && (
                      <div className="border-b border-slate-750 pb-3.5">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Catatan</p>
                        <p className="text-slate-250 text-xs mt-1 font-bold">{item.keterangan}</p>
                      </div>
                    )}

                    {/* Compact Image deck */}
                    {(item.fotoRumah || item.fotoKtpKk || item.fotoDokTanah || item.fotoShm) && (
                      <div className="space-y-1.5 border-b border-slate-750 pb-3.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Attachment Terlampir</p>
                        <div className="flex gap-2 py-0.5">
                          {[
                            { name: 'Rumah', url: item.fotoRumah },
                            { name: 'KTP/KK', url: item.fotoKtpKk },
                            { name: 'Dokumen', url: item.fotoDokTanah },
                            { name: 'SHM', url: item.fotoShm },
                          ]
                            .filter((f) => f.url)
                            .map((p, idx) => (
                              <button
                                key={idx}
                                onClick={() => onSelectDetail(item)}
                                className="bg-slate-800 border border-slate-700 rounded-lg p-1 hover:border-teal-500 text-[9px] text-slate-300 flex items-center gap-1 shadow-sm font-semibold"
                              >
                                <img
                                  src={p.url}
                                  alt={p.name}
                                  className="w-6 h-6 rounded-md object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=150&q=50';
                                  }}
                                />
                                <span className="pr-1">{p.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Quick mobile touch trigger actions */}
                    <div className="flex justify-between items-center pt-1.5 shrink-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelectDetail(item)}
                          className="bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        <button
                          onClick={() => onViewMap(item.id)}
                          className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/15 font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          <MapPin className="w-3.5 h-3.5" /> Peta
                        </button>
                      </div>

                      {currentUser !== 'Tamu' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onEdit(item)}
                            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20 p-2 rounded-xl"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentUser === 'admin' && (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 p-2 rounded-xl cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
