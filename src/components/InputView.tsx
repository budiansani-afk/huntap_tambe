import React, { useState, useEffect, useRef } from 'react';
import { PenerimaHuntap } from '../types';
import { DATA_WILAYAH } from '../data';
import { deleteFromCloudinary } from '../cloudinary';
import { saveHuntapRecord, writeAuditLog } from '../firebase';
import * as XLSX from 'xlsx';
import {
  Save,
  X,
  Compass,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Check,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Trash2,
  HelpCircle,
  Download,
  UploadCloud,
  Sparkles,
} from 'lucide-react';

interface InputViewProps {
  editItem: PenerimaHuntap | null;
  onSave: (data: Omit<PenerimaHuntap, 'id'> & { id?: string }, isBulk?: boolean) => void | Promise<void>;
  onCancelEdit: () => void;
  currentUser: string;
}

export default function InputView({ editItem, onSave, onCancelEdit, currentUser }: InputViewProps) {
  // Form States
  const [nomorRumah, setNomorRumah] = useState('');
  const [nama, setNama] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [luas, setLuas] = useState<number | ''>('');
  const [dokumenTanah, setDokumenTanah] = useState('');
  const [terimaSertipikat, setTerimaSertipikat] = useState<'Sudah' | 'Belum'>('Belum');
  const [noHp, setNoHp] = useState('');
  const [koordinat, setKoordinat] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Image fields
  const [fotoRumah, setFotoRumah] = useState('');
  const [fotoKtpKk, setFotoKtpKk] = useState('');
  const [fotoDokTanah, setFotoDokTanah] = useState('');
  const [fotoShm, setFotoShm] = useState('');

  // Camera stream helper states
  const [showCamera, setShowCamera] = useState(false);
  const [targetPhotoField, setTargetPhotoField] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);

  // Excel Import States
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load edit values
  useEffect(() => {
    if (editItem) {
      setNomorRumah(editItem.nomorRumah || '');
      setNama(editItem.nama || '');
      setKecamatan(editItem.kecamatan || '');
      setDesa(editItem.desa || '');
      setLuas(editItem.luas ?? '');
      setDokumenTanah(editItem.dokumenTanah || '');
      setTerimaSertipikat(editItem.terimaSertipikat || 'Belum');
      setNoHp(editItem.noHp || '');
      setKoordinat(editItem.koordinat || '');
      setKeterangan(editItem.keterangan || '');

      setFotoRumah(editItem.fotoRumah || '');
      setFotoKtpKk(editItem.fotoKtpKk || '');
      setFotoDokTanah(editItem.fotoDokTanah || '');
      setFotoShm(editItem.fotoShm || '');
    } else {
      resetForm();
    }
  }, [editItem]);

  const resetForm = () => {
    setNomorRumah('');
    setNama('');
    setKecamatan('');
    setDesa('');
    setLuas('');
    setDokumenTanah('');
    setTerimaSertipikat('Belum');
    setNoHp('');
    setKoordinat('');
    setKeterangan('');
    setFotoRumah('');
    setFotoKtpKk('');
    setFotoDokTanah('');
    setFotoShm('');
  };

  const handleFetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setKoordinat(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        alert(`Gagal mengambil GPS: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser === 'Tamu') {
      alert('Akses Ditolak! Tamu hanya diizinkan untuk melihat laporan (Read-Only). Silakan ganti pengguna di dropdown atas.');
      return;
    }
    if (!nomorRumah.trim() || !nama.trim()) {
      alert('Kolom Nomor Rumah dan Nama Lengkap wajib diisi!');
      return;
    }
    onSave({
      id: editItem?.id,
      nomorRumah,
      nama,
      kecamatan,
      desa,
      luas: luas === '' ? null : Number(luas),
      dokumenTanah,
      terimaSertipikat,
      noHp,
      koordinat,
      keterangan,
      fotoRumah,
      fotoKtpKk,
      fotoDokTanah,
      fotoShm,
    });
    if (!editItem) {
      resetForm();
    }
  };

  // Helper to request Cloudinary Upload
  const uploadToCloudinary = async (base64OrFile: string | File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', base64OrFile);
    formData.append('upload_preset', 'huntap');

    const res = await fetch('https://api.cloudinary.com/v1_1/de4prnqa4/image/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary Error: ${errText || res.statusText}`);
    }

    const result = await res.json();
    return result.secure_url as string;
  };

  // HTML5 MediaDevices camera capture flows
  const startCamera = async (fieldName: string) => {
    setTargetPhotoField(fieldName);
    setCapturedImage(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      alert('Kamera tidak dapat diakses. Pastikan kamera diizinkan.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
    setTargetPhotoField(null);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const saveCapturedPhoto = async () => {
    if (!capturedImage || !targetPhotoField) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(capturedImage);
      
      if (targetPhotoField === 'fotoRumah') setFotoRumah(uploadedUrl);
      if (targetPhotoField === 'fotoKtpKk') setFotoKtpKk(uploadedUrl);
      if (targetPhotoField === 'fotoDokTanah') setFotoDokTanah(uploadedUrl);
      if (targetPhotoField === 'fotoShm') setFotoShm(uploadedUrl);

      stopCamera();
    } catch (err) {
      console.error(err);
      alert(`Gagal mengunggah ke Cloudinary: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    setter: (url: string) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setActiveUploadField(fieldName);
    try {
      const uploadedUrl = await uploadToCloudinary(file);
      setter(uploadedUrl);
    } catch (err) {
      console.error(err);
      alert(`Gagal mengunggah ke Cloudinary: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActiveUploadField(null);
    }
  };

  const handleResetPhoto = async (photoUrl: string, setter: (url: string) => void) => {
    if (!photoUrl) return;

    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus foto ini? File foto juga akan dihapus secara permanen dari penyimpanan Cloudinary."
    );
    if (!confirmDelete) return;

    setter('');

    try {
      const success = await deleteFromCloudinary(photoUrl);
      if (success) {
        console.log("Foto berhasil dihapus secara permanen dari Cloudinary.");
      } else {
        console.warn("Foto gagal dihapus dari Cloudinary atau bukan url Cloudinary valid.");
      }
    } catch (err) {
      console.error("Gagal melakukan request penghapusan gambar:", err);
    }
  };

  // Excel Import handlers
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportSuccessMessage(null);
    setImportedRows([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (rawJson.length === 0) {
          alert('File Excel kosong atau tidak terbaca.');
          setIsParsing(false);
          return;
        }

        const parsedData = rawJson.map((row: any) => {
          const item: Record<string, any> = {};
          
          Object.entries(row).forEach(([key, val]) => {
            const cleanKey = key.trim().toLowerCase().replace(/[\s_/]/g, '');
            
            if (cleanKey === 'nomorrumah' || cleanKey === 'norumah' || cleanKey === 'blok' || cleanKey === 'blokrumah') {
              item.nomorRumah = String(val).trim().toUpperCase();
            } else if (cleanKey === 'nama' || cleanKey === 'namalengkap' || cleanKey === 'namapenerima' || cleanKey === 'penghuni') {
              item.nama = String(val).trim();
            } else if (cleanKey === 'kecamatan' || cleanKey === 'kec') {
              item.kecamatan = String(val).trim();
            } else if (cleanKey === 'desa' || cleanKey === 'kelurahan') {
              item.desa = String(val).trim();
            } else if (cleanKey === 'luas' || cleanKey === 'luaskavling' || cleanKey === 'luasm2') {
              const numLuas = Number(val);
              item.luas = isNaN(numLuas) ? null : numLuas;
            } else if (cleanKey === 'dokumentanah' || cleanKey === 'alashak' || cleanKey === 'surattanah') {
              item.dokumenTanah = String(val).trim();
            } else if (cleanKey === 'sertipikat' || cleanKey === 'statussertipikat' || cleanKey === 'statusshm' || cleanKey === 'terimasertipikat') {
              const cleanVal = String(val).trim().toLowerCase();
              item.terimaSertipikat = (cleanVal === 'sudah' || cleanVal === 'yes' || cleanVal === 'ada' || cleanVal === 'shm') ? 'Sudah' : 'Belum';
            } else if (cleanKey === 'nohp' || cleanKey === 'kontak' || cleanKey === 'telepon' || cleanKey === 'phone') {
              item.noHp = String(val).trim();
            } else if (cleanKey === 'koordinat' || cleanKey === 'gps' || cleanKey === 'latlong') {
              item.koordinat = String(val).trim();
            } else if (cleanKey === 'keterangan' || cleanKey === 'catatan') {
              item.keterangan = String(val).trim();
            }
          });

          return {
            nomorRumah: item.nomorRumah || '',
            nama: item.nama || '',
            kecamatan: item.kecamatan || '',
            desa: item.desa || '',
            luas: item.luas !== undefined ? item.luas : null,
            dokumenTanah: item.dokumenTanah || '',
            terimaSertipikat: item.terimaSertipikat || 'Belum',
            noHp: item.noHp || '',
            koordinat: item.koordinat || '',
            keterangan: item.keterangan || '',
            fotoRumah: '',
            fotoKtpKk: '',
            fotoDokTanah: '',
            fotoShm: '',
          };
        });

        setImportedRows(parsedData);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan file dalam format .xlsx atau .xls.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      alert('Error saat membaca file.');
      setIsParsing(false);
    };

    reader.readAsBinaryString(file);
  };

  const removeRow = (index: number) => {
    const updated = [...importedRows];
    updated.splice(index, 1);
    setImportedRows(updated);
  };

  const startImporting = async () => {
    if (currentUser === 'Tamu') {
      alert('Akses Ditolak! Akun Tamu hanya memiliki wewenang melihat data.');
      return;
    }
    const validRows = importedRows.filter(row => row.nomorRumah.trim() && row.nama.trim());
    if (validRows.length === 0) {
      alert('Tidak ada data valid yang siap diimport (Nama dan No Rumah wajib diisi).');
      return;
    }

    const confirmImport = window.confirm(`Apakah Anda yakin ingin mengimport ${validRows.length} data ini ke Firestore?`);
    if (!confirmImport) return;

    setImportProgress({ current: 0, total: validRows.length });

    try {
      for (let i = 0; i < validRows.length; i++) {
        setImportProgress({ current: i + 1, total: validRows.length });
        await onSave(validRows[i], true);
      }
      
      await writeAuditLog(
        currentUser,
        'Impor Massal',
        `Berhasil mengimport ${validRows.length} data penerima Huntap secara massal dari Excel.`
      );

      setImportSuccessMessage(`Berhasil mengimport ${validRows.length} data penerima Huntap secara massal!`);
      setImportedRows([]);
    } catch (err) {
      console.error(err);
      alert('Ada kesalahan saat menyimpan data import.');
    } finally {
      setImportProgress(null);
    }
  };

  const downloadTemplate = () => {
    const sampleData = [
      {
        'Nomor Rumah': 'A.01',
        'Nama': 'Ahmad Fauzi',
        'Kecamatan': 'Sumber',
        'Desa': 'Pasir',
        'Luas': 120,
        'Dokumen Tanah': 'Sertifikat',
        'Status SHM': 'Sudah',
        'No HP': '081234567890',
        'Koordinat': '-7.234567, 110.123456',
        'Keterangan': 'Pembangunan selesai 100%'
      },
      {
        'Nomor Rumah': 'B.02',
        'Nama': 'Siti Aminah',
        'Kecamatan': 'Sumber',
        'Desa': 'Pasir',
        'Luas': 135,
        'Dokumen Tanah': 'AJB',
        'Status SHM': 'Belum',
        'No HP': '085678901234',
        'Koordinat': '-7.234599, 110.123488',
        'Keterangan': 'Masih dalam proses pematangan lahan'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');
    XLSX.writeFile(workbook, 'Template_Import_Huntap.xlsx');
  };

  return (
    <div className="p-4 space-y-5">
      {/* Edit indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            {editItem ? '✏️ Edit Data Penerima' : showImportPanel ? '📂 Import Massal Excel' : '➕ Input Penerima Baru'}
          </h2>
          <p className="text-slate-400 text-xs">
            {editItem 
              ? 'Ubah detail data kelayakan penerima.' 
              : showImportPanel 
                ? 'Unggah berkas spreadsheet untuk mengimport data secara massal.' 
                : 'Isi formulir kelayakan huntap dengan koordinat fisik.'}
          </p>
        </div>
        {editItem ? (
          <button
            onClick={onCancelEdit}
            className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg font-bold"
          >
            Batal Ubah
          </button>
        ) : (
          <button
            onClick={() => {
              setShowImportPanel(!showImportPanel);
              setImportedRows([]);
              setImportSuccessMessage(null);
            }}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-extrabold flex items-center gap-1.5 transition-all ${
              showImportPanel 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
            }`}
          >
            {showImportPanel ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Batal Import</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </>
            )}
          </button>
        )}
      </div>

      {showImportPanel ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Instructions and Download Template */}
          <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl shadow-md space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-black text-slate-200 uppercase">Panduan Import Excel / CSV</h4>
                <p className="text-slate-400 text-2xs leading-relaxed">
                  Gunakan template standar agar data terbaca dengan sempurna. Kolom yang dapat terbaca otomatis meliputi:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Nomor Rumah (A.01, B.02) *</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Nama Lengkap *</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Kecamatan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Desa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>Luas Kavling (m²)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>Dokumen Tanah</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>Status SHM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>No HP (Kontak)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>Koordinat GPS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    <span>Keterangan</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] pt-1">
                  * Kolom Nomor Rumah dan Nama Lengkap wajib diisi agar data dapat disimpan ke sistem.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-750/70 flex justify-end">
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-xs bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-700/60 px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh Template Excel</span>
              </button>
            </div>
          </div>

          {/* Upload Area / Form */}
          {importSuccessMessage ? (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-100">Proses Import Selesai</h3>
              <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed">
                {importSuccessMessage}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setImportSuccessMessage(null)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Import File Lain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportPanel(false);
                    setImportSuccessMessage(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <>
              {importedRows.length === 0 ? (
                <div className="border-2 border-dashed border-slate-700/80 rounded-2xl bg-slate-800/40 p-8 text-center hover:bg-slate-800/75 transition-all relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileImport}
                    disabled={isParsing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3 pointer-events-none">
                    <div className="w-12 h-12 bg-slate-850 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-slate-700/50">
                      {isParsing ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-200">
                        {isParsing ? 'Membaca data berkas...' : 'Pilih atau Seret Berkas ke Sini'}
                      </p>
                      <p className="text-slate-500 text-[10px] mt-1">
                        Mendukung ekstensi .xlsx, .xls, .csv (Maksimal 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results summary and action buttons */}
                  <div className="bg-slate-800 border border-slate-750 p-4 rounded-2xl flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">Total Data Terbaca</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-slate-100">{importedRows.length}</span>
                        <span className="text-xs text-slate-400">baris terdeteksi</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setImportedRows([])}
                        className="bg-slate-850 hover:bg-slate-750 text-slate-300 border border-slate-700/60 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset Berkas
                      </button>
                      <button
                        type="button"
                        onClick={startImporting}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Proses Import ({importedRows.filter(r => r.nomorRumah && r.nama).length} Valid)</span>
                      </button>
                    </div>
                  </div>

                  {/* List preview of parsed rows */}
                  <div className="bg-slate-800 border border-slate-750 rounded-2xl overflow-hidden shadow-md">
                    <div className="p-3 bg-slate-850/60 border-b border-slate-750 flex items-center justify-between">
                      <span className="text-2xs font-extrabold text-slate-300 uppercase tracking-wide">Pratinjau Data Impor</span>
                      <span className="text-[10px] bg-slate-750 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                        {importedRows.filter(r => r.nomorRumah && r.nama).length} valid / {importedRows.length} baris
                      </span>
                    </div>

                    <div className="divide-y divide-slate-750 max-h-96 overflow-y-auto">
                      {importedRows.map((row, idx) => {
                        const isValid = row.nomorRumah.trim() && row.nama.trim();
                        return (
                          <div key={idx} className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${isValid ? 'hover:bg-slate-750/20' : 'bg-rose-500/5'}`}>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                  isValid 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                                }`}>
                                  {row.nomorRumah || 'Tanpa No Rumah'}
                                </span>
                                <h5 className="text-xs font-bold text-slate-200 truncate">{row.nama || 'Tanpa Nama'}</h5>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-400">
                                <div>
                                  <span className="font-semibold">Wilayah:</span> Kec. {row.kecamatan || '-'}, Desa {row.desa || '-'}
                                </div>
                                <div>
                                  <span className="font-semibold">Sertipikat:</span> {row.terimaSertipikat || '-'}
                                </div>
                                <div>
                                  <span className="font-semibold">Kontak:</span> {row.noHp || '-'}
                                </div>
                                <div>
                                  <span className="font-semibold">Koordinat:</span> {row.koordinat || '-'}
                                </div>
                                {row.luas && (
                                  <div className="col-span-2">
                                    <span className="font-semibold">Luas Kavling:</span> {row.luas} m²
                                  </div>
                                )}
                                {row.keterangan && (
                                  <div className="col-span-2 italic text-slate-500">
                                    "{row.keterangan}"
                                  </div>
                                )}
                              </div>

                              {!isValid && (
                                <p className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Kolom Nomor Rumah dan Nama Lengkap wajib diisi! Row ini akan dilewati.</span>
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-1.5 bg-slate-850 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Import Processing Progress Modal overlay */}
          {importProgress && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-55 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">Sedang Mengimport Data</h4>
                  <p className="text-xs text-slate-400">Silakan tunggu, data sedang disimpan ke Firebase Firestore.</p>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-300 font-bold font-mono">
                    <span>Progres: {importProgress.current} / {importProgress.total}</span>
                    <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identitas Section */}
          <div className="bg-slate-800 border border-slate-750/70 p-4 rounded-2xl space-y-3.5 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-750 pb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-slate-300 uppercase shrink-0">1. Identitas & Tata Letak</span>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-slate-400 uppercase">Nomor Rumah *</label>
              <input
                type="text"
                required
                value={nomorRumah}
                onChange={(e) => setNomorRumah(e.target.value.toUpperCase())}
                placeholder="Contoh: A.01, B.12"
                className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full font-bold uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-slate-400 uppercase">Nama Penghuni *</label>
              <input
                type="text"
                required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Ketik nama lengkap"
              className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1 relative">
              <label className="text-2xs font-extrabold text-slate-400 uppercase block">Kec. Asal</label>
              <select
                value={kecamatan}
                onChange={(e) => {
                  setKecamatan(e.target.value);
                  setDesa('');
                }}
                className="bg-slate-850 border border-slate-700/60 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-full cursor-pointer font-black"
              >
                <option value="" className="text-slate-400 font-normal">Pilih Kec.</option>
                {Object.keys(DATA_WILAYAH).map((kec) => (
                  <option key={kec} value={kec}>
                    {kec}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-slate-400 uppercase block">Desa Asal</label>
              <select
                value={desa}
                disabled={!kecamatan}
                onChange={(e) => setDesa(e.target.value)}
                className="bg-slate-850 border border-slate-700/60 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-full disabled:opacity-40 cursor-pointer font-black"
              >
                <option value="" className="text-slate-400 font-normal">Pilih Desa</option>
                {kecamatan &&
                  DATA_WILAYAH[kecamatan]?.map((d) => (
                     <option key={d} value={d}>
                       {d}
                     </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Fisik & Administrasi */}
        <div className="bg-slate-800 border border-slate-750/70 p-4 rounded-2xl space-y-3.5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-750 pb-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-black text-slate-300 uppercase shrink-0">2. Teknis & Sertifikasi</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-slate-400 uppercase">Luas Tanah (m²)</label>
              <input
                type="number"
                value={luas}
                onChange={(e) => setLuas(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 100"
                className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-extrabold text-slate-400 uppercase">Sertipikat</label>
              <select
                value={terimaSertipikat}
                onChange={(e) => setTerimaSertipikat(e.target.value as 'Sudah' | 'Belum')}
                className="bg-slate-850 border border-slate-700/60 rounded-xl px-2.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 w-full font-bold cursor-pointer"
              >
                <option value="Belum">🔴 Belum</option>
                <option value="Sudah">🟢 Sudah</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-extrabold text-slate-400 uppercase">Dokumen Tanah Asal</label>
            <input
              type="text"
              value={dokumenTanah}
              onChange={(e) => setDokumenTanah(e.target.value)}
              placeholder="AJB No. xx / Sporadik / SHM Waris"
              className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-extrabold text-slate-400 uppercase">No Handphone / WA</label>
            <input
              type="text"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="Contoh: 082340xxx"
              className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-2xs font-extrabold text-slate-400 uppercase">
              <span>Titik Koordinat (GPS)</span>
              <button
                type="button"
                onClick={handleFetchGPS}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded-md"
              >
                <Compass className="w-3 h-3 text-teal-400" /> Ambil GPS
              </button>
            </div>
            <input
              type="text"
              value={koordinat}
              onChange={(e) => setKoordinat(e.target.value)}
              placeholder="-8.5134, 118.6812"
              className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-2xs font-extrabold text-slate-400 uppercase">Catatan Keterangan</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan sengketa / penyerahan..."
              className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>
        </div>

        {/* Dynamic Image Attachment Previews & Camera Snap overlays */}
        <div className="bg-slate-800 border border-slate-750/70 p-4 rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-750 pb-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-slate-300 uppercase shrink-0">3. Lampiran Berkas Gambar</span>
          </div>

          {[
            { label: 'Foto Fisik Rumah', value: fotoRumah, setter: setFotoRumah, field: 'fotoRumah' },
            { label: 'Foto KTP / KK', value: fotoKtpKk, setter: setFotoKtpKk, field: 'fotoKtpKk' },
            { label: 'Foto Dokumen Tanah Asal', value: fotoDokTanah, setter: setFotoDokTanah, field: 'fotoDokTanah' },
            { label: 'Foto Sertipikat Baru (SHM)', value: fotoShm, setter: setFotoShm, field: 'fotoShm' },
          ].map((item) => (
            <div key={item.field} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-2xs font-extrabold text-slate-400 uppercase">{item.label}</label>
                <div className="flex items-center gap-1.5">
                  <label className="cursor-pointer text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    <ImageIcon className="w-3 h-3" /> Pilih File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelected(e, item.field, item.setter)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => startCamera(item.field)}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20"
                  >
                    <Camera className="w-3 h-3 text-indigo-400" /> Kamera
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    placeholder="https://tautan-gambar-cloudinary..."
                    className="bg-slate-850 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full font-mono"
                  />
                  {activeUploadField === item.field && (
                    <div className="absolute right-3.5 top-2.5 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                      <span className="text-[9px] font-bold text-teal-400">Uploading...</span>
                    </div>
                  )}
                </div>
                {item.value && (
                  <button
                    type="button"
                    onClick={() => handleResetPhoto(item.value, item.setter)}
                    className="p-1 px-2 border border-rose-500/25 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/25 text-xs font-black"
                  >
                    Reset
                  </button>
                )}
              </div>

              {item.value && (
                <div className="p-1.5 border border-slate-700 bg-slate-850 rounded-xl inline-block">
                  <img
                    src={item.value}
                    alt={item.label}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=150&q=50';
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 pt-2">
          {currentUser === 'Tamu' ? (
            <div className="w-full text-center p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Akses Mode Tamu (Membaca Saja). Silakan ganti pengguna ke "Petugas" di dropdown atas untuk melakukan editing data.</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={resetForm}
                className="w-1/3 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-xl py-3 text-xs font-bold font-mono transition-all border border-slate-750"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="w-2/3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl py-3 text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{editItem ? 'Simpan Perubahan' : 'Simpan Data Baru'}</span>
              </button>
            </>
          )}
        </div>
      </form>
      )}

      {/* HTML5 Native Stream Overlay Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/95 z-55 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200">
              📸 Capture Gambar :{' '}
              <span className="text-teal-400">
                {targetPhotoField === 'fotoRumah'
                  ? 'Fisik Rumah'
                  : targetPhotoField === 'fotoKtpKk'
                    ? 'KTP / KK'
                    : targetPhotoField === 'fotoDokTanah'
                      ? 'Dokumen Tanah'
                      : 'Sertipikat SHM'}
              </span>
            </h3>
            <button
              onClick={stopCamera}
              className="bg-slate-800 text-slate-400 p-1.5 rounded-full hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              ></video>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2.5">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                <span className="text-xs font-bold text-slate-200">Mengunggah ke Cloud...</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full max-w-sm mt-4">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Ambil Ulang
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={saveCapturedPhoto}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Foto
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="bg-slate-800 text-slate-300 p-3 rounded-xl"
                  title="Switch Front/Back Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" fill="currentColor" /> Ambil Gambar
                </button>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}
    </div>
  );
}
