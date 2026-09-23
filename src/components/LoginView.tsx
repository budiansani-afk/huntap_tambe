import React, { useState } from 'react';
import { Lock, User, Sparkles, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import appLogo from '../assets/images/app_logo_pelaksana_1790154102181.jpg';

interface LoginViewProps {
  onLogin: (username: string, isAdmin: boolean) => void;
  onLoginAsGuest: () => void;
}

export default function LoginView({ onLogin, onLoginAsGuest }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Nama pengguna/akun wajib diisi!');
      return;
    }

    if (cleanUser === 'admin' && password === 'admin') {
      // Admin Mode: shows log
      onLogin('admin', true);
    } else if (password === 'huntap') {
      // Regular User Mode: hides log
      onLogin(cleanUser, false);
    } else {
      setError('Kata sandi salah!');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto shadow-md border border-slate-750 bg-white/10">
          <img
            src={appLogo}
            alt="Logo Aplikasi Huntap"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center justify-center gap-1.5 leading-tight">
            Huntap Bima Mobile <Sparkles className="w-4 h-4 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 font-bold">Portal Sertifikasi & Pendataan Fisik Rumah</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-750/70 p-5 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-slate-750 pb-2.5">
          <KeyRound className="w-4 h-4 text-teal-400" /> Autentikasi Pengguna
        </h3>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] p-2.5 rounded-xl flex items-center gap-2 font-bold leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase">Akun / Nama Pengguna</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5.5 text-slate-500 w-4 h-4" style={{ top: '11px' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: Nama Anda"
                className="bg-slate-850 border border-slate-700/60 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full font-bold"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 text-slate-500 w-4 h-4" style={{ top: '11px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ketik password"
                className="bg-slate-850 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full font-semibold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-400 focus:outline-none"
                style={{ top: '10px' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 px-4 mt-5 cursor-pointer"
          >
            Masuk Sekarang
          </button>
        </form>
      </div>

      <button
        onClick={onLoginAsGuest}
        className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-750/50 text-slate-300 font-bold py-2 px-4 rounded-xl text-[11px] transition duration-150"
      >
        👤 Masuk Tanpa Autentikasi (Tamu - Hanya Baca)
      </button>
    </div>
  );
}
