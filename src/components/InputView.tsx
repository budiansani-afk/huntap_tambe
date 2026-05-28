import React, { useState, useEffect, useRef } from 'react';
import { PenerimaHuntap } from '../types';
import { DATA_WILAYAH } from '../data';
import { deleteFromCloudinary } from '../cloudinary';
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
} from 'lucide-react';

interface InputViewProps {
  editItem: PenerimaHuntap | null;
  onSave: (data: Omit<PenerimaHuntap, 'id'> & { id?: string }) => void;
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

  return (
    <div className="p-4 space-y-5">
      {/* Edit indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            {editItem ? '✏️ Edit Data Penerima' : '➕ Input Penerima Baru'}
          </h2>
          <p className="text-slate-400 text-xs">Isi formulir kelayakan huntap dengan koordinat fisik.</p>
        </div>
        {editItem && (
          <button
            onClick={onCancelEdit}
            className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg font-bold"
          >
            Batal Ubah
          </button>
        )}
      </div>

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
