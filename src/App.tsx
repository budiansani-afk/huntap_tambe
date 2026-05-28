import React, { useState, useEffect, useRef, useMemo } from 'react';
import SmartphoneShell from './components/SmartphoneShell';
import DashboardView from './components/DashboardView';
import InputView from './components/InputView';
import RekapView from './components/RekapView';
import PetaView from './components/PetaView';
import RiwayatView from './components/RiwayatView';
import DetailModal from './components/DetailModal';
import { deleteFromCloudinary } from './cloudinary';

import { PenerimaHuntap, UserLog } from './types';
import { INITIAL_HUN_DATA, INITIAL_LOGS_DATA } from './data';
import { Home, FileText, Database, Map, ClipboardList, Info, Sparkles, Sun, Moon, LogOut } from 'lucide-react';
import LoginView from './components/LoginView';

import { signInAnonymously, signOut } from 'firebase/auth';
import {
  auth,
  testConnection,
  streamHuntapData,
  streamAuditLogs,
  saveHuntapRecord,
  deleteHuntapRecord,
  writeAuditLog,
  clearAllAuditLogs,
  deleteAuditLog,
} from './firebase';

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

export default function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem('huntap_authenticated') === 'true'
  );
  const [currentUser, setCurrentUser] = useState<string>(
    () => localStorage.getItem('huntap_current_user') || 'Tamu'
  );
  const [showLogsTab, setShowLogsTab] = useState<boolean>(
    () => localStorage.getItem('huntap_show_logs') === 'true'
  );

  // Styling & Theme States (Terang vs Gelap)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => localStorage.getItem('huntap_theme') !== 'light'
  );

  // Navigation
  const [activeTab, setActiveTab] = useState<'beranda' | 'input' | 'rekap' | 'peta' | 'riwayat'>('beranda');

  // Application Data States (Hydrated in real-time from Cloud Firestore)
  const [dataList, setDataList] = useState<PenerimaHuntap[]>([]);
  const [logsList, setLogsList] = useState<UserLog[]>([]);
  const isInitialLogsRef = useRef<boolean>(true);
  const [newLogNotification, setNewLogNotification] = useState<UserLog | null>(null);

  // Connection and Offline synchronization status
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [pendingSaves, setPendingSaves] = useState<(Omit<PenerimaHuntap, 'id'> & { id?: string })[]>(() => {
    try {
      const saved = localStorage.getItem('huntap_pending_saves');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingDeletes, setPendingDeletes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('huntap_pending_deletes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cachedData, setCachedData] = useState<PenerimaHuntap[]>(() => {
    try {
      const saved = localStorage.getItem('huntap_cached_data');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Watch and persist offline queues
  useEffect(() => {
    localStorage.setItem('huntap_pending_saves', JSON.stringify(pendingSaves));
  }, [pendingSaves]);

  useEffect(() => {
    localStorage.setItem('huntap_pending_deletes', JSON.stringify(pendingDeletes));
  }, [pendingDeletes]);

  // Persist Firestore list to local cached fallback
  useEffect(() => {
    if (dataList.length > 0) {
      setCachedData(dataList);
      localStorage.setItem('huntap_cached_data', JSON.stringify(dataList));
    }
  }, [dataList]);

  // Monitor network status events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute aggregated real-time + local offline changes instantly
  const displayData = useMemo(() => {
    let list = dataList.length > 0 ? [...dataList] : [...cachedData];

    // Apply offline modifications
    pendingSaves.forEach((ps) => {
      const idx = list.findIndex((item) => item.id === ps.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...ps } as PenerimaHuntap;
      } else {
        list.push(ps as PenerimaHuntap);
      }
    });

    // Filter out deleted items
    if (pendingDeletes.length > 0) {
      list = list.filter((item) => !pendingDeletes.includes(item.id));
    }

    // Sort naturally
    list.sort((a, b) => (a.nomorRumah || '').localeCompare(b.nomorRumah || '', undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [dataList, cachedData, pendingSaves, pendingDeletes]);

  // Focus tracking (Jump from rekap to map coordinate)
  const [focusId, setFocusId] = useState<string | null>(null);

  // Form Editing Tracking
  const [editItem, setEditItem] = useState<PenerimaHuntap | null>(null);

  // Active detail modal tracking
  const [selectedDetail, setSelectedDetail] = useState<PenerimaHuntap | null>(null);

  // Dashboard quick filter state
  const [quickFilter, setQuickFilter] = useState<{ field: string; value: string }>({ field: '', value: '' });

  // Firestore seeding indicator state
  const [seeding, setSeeding] = useState(false);

  // Sync simulated access roles with live Firebase Auth
  useEffect(() => {
    if (currentUser === 'Tamu') {
      signOut(auth).catch(console.error);
    } else {
      // Authenticate behind the scenes to allow writes to Firebase Firestore
      signInAnonymously(auth).catch((err) => {
        console.error("Firebase Auth background logging failed: ", err);
      });
    }
  }, [currentUser]);

  // Credentials and Actions Handlers
  const handleLogin = (username: string, isAdmin: boolean) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    setShowLogsTab(isAdmin);
    localStorage.setItem('huntap_authenticated', 'true');
    localStorage.setItem('huntap_current_user', username);
    localStorage.setItem('huntap_show_logs', isAdmin ? 'true' : 'false');
    
    // Log login activity
    writeAuditLog(
      username,
      'Login Portal',
      isAdmin 
        ? 'Pengguna berhasil masuk sebagai Administrator.' 
        : `Pengguna berhasil masuk sebagai Petugas Hub (${username}).`
    ).catch(console.error);
  };

  const handleLoginAsGuest = () => {
    setIsAuthenticated(true);
    setCurrentUser('Tamu');
    setShowLogsTab(false);
    localStorage.setItem('huntap_authenticated', 'true');
    localStorage.setItem('huntap_current_user', 'Tamu');
    localStorage.setItem('huntap_show_logs', 'false');
  };

  const handleLogout = () => {
    if (currentUser !== 'Tamu') {
      writeAuditLog(currentUser, 'Logout Portal', 'Pengguna keluar dari portal mobile.').catch(console.error);
    }
    setIsAuthenticated(false);
    setCurrentUser('Tamu');
    setShowLogsTab(false);
    localStorage.setItem('huntap_authenticated', 'false');
    localStorage.setItem('huntap_current_user', 'Tamu');
    localStorage.setItem('huntap_show_logs', 'false');
    setActiveTab('beranda');
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem('huntap_theme', nextDark ? 'dark' : 'light');
  };

  // Light Theme overrides stylesheet definitions
  const lightThemeStyles = `
    @keyframes slideInFromTop {
      0% {
        transform: translateY(-15px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    .animate-notification-slide {
      animation: slideInFromTop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .light-mode-container {
      background-color: #f8fafc !important;
    }
    .light-mode-container .bg-slate-950 {
      background-color: #f1f5f9 !important;
    }
    .light-mode-container .bg-slate-900 {
      background-color: #f8fafc !important;
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .bg-slate-850 {
      background-color: #ffffff !important;
      border-color: #e2e8f0 !important;
    }
    .light-mode-container .bg-slate-800 {
      background-color: #ffffff !important;
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .bg-slate-800\\/60 {
      background-color: rgba(255, 255, 255, 0.6) !important;
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .bg-slate-850\\/40 {
      background-color: rgba(241, 245, 249, 0.4) !important;
    }
    .light-mode-container .bg-slate-900\\/95 {
      background-color: rgba(248, 250, 252, 0.95) !important;
      border-color: #e2e8f0 !important;
    }
    .light-mode-container .text-slate-100 {
      color: #0f172a !important;
    }
    .light-mode-container .text-slate-200 {
      color: #1e293b !important;
    }
    .light-mode-container .text-slate-300 {
      color: #334155 !important;
    }
    .light-mode-container .text-slate-400 {
      color: #475569 !important;
    }
    .light-mode-container .text-slate-405 {
      color: #475569 !important;
    }
    .light-mode-container .text-slate-500 {
      color: #64748b !important;
    }
    .light-mode-container .border-slate-850 {
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .border-slate-800 {
      border-color: #e2e8f0 !important;
    }
    .light-mode-container .border-slate-755 {
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .border-slate-750 {
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .border-slate-750\\/70 {
      border-color: rgba(203, 213, 225, 0.7) !important;
    }
    .light-mode-container .border-slate-750\\/75 {
      border-color: rgba(203, 213, 225, 0.75) !important;
    }
    .light-mode-container .border-slate-750\\/80 {
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .border-slate-700 {
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .border-slate-700\\/60 {
      border-color: rgba(203, 213, 225, 0.6) !important;
    }
    .light-mode-container .border-slate-800\\/60 {
      border-color: rgba(226, 232, 240, 0.6) !important;
    }
    .light-mode-container .bg-slate-800\\/80 {
      background-color: rgba(255, 255, 255, 0.8) !important;
      border-color: #cbd5e1 !important;
    }
    .light-mode-container .bg-slate-850\\/50 {
      background-color: rgba(241, 245, 249, 0.5) !important;
    }
    .light-mode-container input,
    .light-mode-container select,
    .light-mode-container textarea {
      background-color: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
    }
    .light-mode-container input::placeholder,
    .light-mode-container textarea::placeholder {
      color: #94a3b8 !important;
    }
    .light-mode-container .bg-emerald-600\\/10 {
      background-color: #ecfdf5 !important;
      border-color: #a7f3d0 !important;
      color: #047857 !important;
    }
    .light-mode-container .bg-emerald-500\\/10 {
      background-color: #ecfdf5 !important;
      color: #16a34a !important;
    }
    .light-mode-container .bg-teal-500\\/10 {
      background-color: #f0fdfa !important;
      color: #0d9488 !important;
    }
    .light-mode-container .bg-amber-600\\/10 {
      background-color: #fffbeb !important;
      border-color: #fde68a !important;
      color: #b45309 !important;
    }
    .light-mode-container .bg-amber-500\\/10 {
      background-color: #fffbeb !important;
      color: #d97706 !important;
    }
    .light-mode-container .bg-rose-500\\/10 {
      background-color: #fff1f2 !important;
      border-color: #fecdd3 !important;
      color: #be123c !important;
    }
    .light-mode-container .bg-indigo-500\\/10 {
      background-color: #eef2ff !important;
      color: #4338ca !important;
    }
    .light-mode-container .bg-slate-700 {
      background-color: #e2e8f0 !important;
    }
    .light-mode-container .stroke-slate-700 {
      stroke: #e2e8f0 !important;
    }
    .light-mode-container .stroke-emerald-500 {
      stroke: #10b981 !important;
    }
    .light-mode-container .text-emerald-400 {
      color: #15803d !important;
    }
    .light-mode-container .text-amber-400 {
      color: #b45309 !important;
    }
    .light-mode-container .text-teal-400 {
      color: #0d9488 !important;
    }
    .light-mode-container .text-amber-500 {
      color: #b45309 !important;
    }
    .light-mode-container .text-rose-400 {
      color: #e11d48 !important;
    }
    .light-mode-container .text-indigo-400 {
      color: #4f46e5 !important;
    }
    .light-mode-container .text-blue-400 {
      color: #1d4ed8 !important;
    }
    .light-mode-container .bg-slate-900\\/90 {
      background-color: rgba(255, 255, 255, 0.9) !important;
      border-color: #cbd5e1 !important;
    }

    /* Pitch Black Dark Mode Overrides (Soft Gray and Slate For Content Cards) */
    .dark-mode-container {
      background-color: #000000 !important;
    }
    .dark-mode-container .text-slate-200,
    .dark-mode-container .text-slate-300,
    .dark-mode-container .text-slate-350,
    .dark-mode-container .text-slate-400,
    .dark-mode-container .text-slate-405,
    .dark-mode-container .text-slate-450,
    .dark-mode-container .text-slate-500,
    .dark-mode-container .text-gray-300,
    .dark-mode-container .text-gray-400,
    .dark-mode-container .text-gray-500 {
      color: #ffffff !important;
    }
    .dark-mode-container .bg-slate-950 {
      background-color: #000000 !important;
    }
    .dark-mode-container .bg-slate-900 {
      background-color: #000000 !important;
      border-color: #27272a !important;
    }
    .dark-mode-container .bg-slate-850 {
      background-color: #27272a !important;
      border-color: #3f3f46 !important;
    }
    .dark-mode-container .bg-slate-800 {
      background-color: #1f2937 !important;
      border-color: #374151 !important;
    }
    .dark-mode-container .bg-slate-800\\/60 {
      background-color: rgba(31, 41, 55, 0.6) !important;
      border-color: #374151 !important;
    }
    .dark-mode-container .bg-slate-850\\/40 {
      background-color: rgba(39, 39, 42, 0.4) !important;
    }
    .dark-mode-container .bg-slate-900\\/95 {
      background-color: rgba(0, 0, 0, 0.95) !important;
      border-color: #27272a !important;
    }
    .dark-mode-container .bg-slate-900\\/90 {
      background-color: rgba(0, 0, 0, 0.9) !important;
      border-color: #27272a !important;
    }
    .dark-mode-container .bg-slate-800\\/80 {
      background-color: rgba(31, 41, 55, 0.8) !important;
      border-color: #374151 !important;
    }
    .dark-mode-container .bg-slate-850\\/50 {
      background-color: rgba(39, 39, 42, 0.5) !important;
    }
    .dark-mode-container input,
    .dark-mode-container select,
    .dark-mode-container textarea {
      background-color: #1f2937 !important;
      color: #f1f5f9 !important;
      border-color: #374151 !important;
    }
  `;

  // Load real-time Firestore streams
  useEffect(() => {
    testConnection(); // Validate credentials on boot

    const unsubHuntap = streamHuntapData(
      (data) => {
        setDataList(data);
      },
      (error) => {
        console.error('Error during real-time huntap streaming:', error);
      }
    );

    const unsubLogs = streamAuditLogs(
      (logs) => {
        if (logs.length > 0) {
          if (!isInitialLogsRef.current) {
            const newest = logs[0];
            setLogsList((prev) => {
              if (prev.length > 0 && prev[0].id !== newest.id) {
                setNewLogNotification(newest);
              }
              return logs;
            });
          } else {
            setLogsList(logs);
            isInitialLogsRef.current = false;
          }
        } else {
          setLogsList(logs);
          isInitialLogsRef.current = false;
        }
      },
      (error) => {
        console.error('Error during real-time logs streaming:', error);
      }
    );

    return () => {
      unsubHuntap();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    if (newLogNotification) {
      const timer = setTimeout(() => {
        setNewLogNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [newLogNotification]);

  const syncOfflineChanges = async (currentSaves = pendingSaves, currentDeletes = pendingDeletes) => {
    if (currentSaves.length === 0 && currentDeletes.length === 0) return;
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      // 1. Process deletes queued offline
      for (const idToDelete of currentDeletes) {
        await deleteHuntapRecord(idToDelete);
        await writeAuditLog(
          currentUser,
          'Sinkronisasi Hapus Data',
          `Menghapus data ID: ${idToDelete} otomatis setelah jaringan kembali online.`
        );
      }

      // 2. Process saves queued offline
      for (const itemToSave of currentSaves) {
        const { id, ...dataCopy } = itemToSave;
        
        if (id && id.startsWith('offline-')) {
          // New offline entry, save as new online record
          await saveHuntapRecord(dataCopy);
          await writeAuditLog(
            currentUser,
            'Sinkronisasi Tambah Data',
            `Menambahkan KK baru: ${itemToSave.nama} (No Rumah: ${itemToSave.nomorRumah}) otomatis setelah kembali online.`
          );
        } else if (id) {
          // Existing record updated offline, save as update
          await saveHuntapRecord({ id, ...dataCopy });
          await writeAuditLog(
            currentUser,
            'Sinkronisasi Modifikasi Data',
            `Memperbarui No Rumah: ${itemToSave.nomorRumah} (KK: ${itemToSave.nama}) otomatis setelah kembali online.`
          );
        } else {
          await saveHuntapRecord(dataCopy);
        }
      }

      // Clear the local queues
      setPendingSaves([]);
      setPendingDeletes([]);
      alert('Koneksi internet terdeteksi online! Seluruh data perubahan offline berhasil disinkronkan secara otomatis.');
    } catch (err) {
      console.error('Gagal menyinkronkan data offline:', err);
      alert(`Sinkronisasi tertunda: ${err instanceof Error ? err.message : String(err)}. Data offline tetap tersimpan aman di perangkat Anda.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger sync when transitions to online
  useEffect(() => {
    if (isOnline && (pendingSaves.length > 0 || pendingDeletes.length > 0)) {
      syncOfflineChanges(pendingSaves, pendingDeletes);
    }
  }, [isOnline]);

  const handleSeedMockData = async () => {
    if (currentUser === 'Tamu') {
      alert('Akses Ditolak! Tamu tidak diizinkan untuk mengubah database.');
      return;
    }
    setSeeding(true);
    try {
      // Save all initial demo items to live Firestore
      for (const item of INITIAL_HUN_DATA) {
        // Strip temporary offline IDs
        const { id, ...cleanedData } = item;
        await saveHuntapRecord(cleanedData);
      }
      // Log seeding activity
      await writeAuditLog(
        currentUser,
        'Seeding Database',
        'Mengimpor seluruh data demo awal (5 KK) ke Cloud Firestore.'
      );
      alert('Sukses! Seluruh data demo pendataan berhasil diunggah online.');
    } catch (err) {
      alert(`Gagal mengupload data demo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveItem = async (itemData: Omit<PenerimaHuntap, 'id'> & { id?: string }) => {
    if (currentUser === 'Tamu') {
      alert('Akses Ditolak! Tamu hanya diizinkan untuk melihat laporan.');
      return;
    }

    if (!isOnline) {
      const targetId = itemData.id || `offline-${Date.now()}`;
      const localItem = { ...itemData, id: targetId };

      setPendingSaves((prev) => {
        const idx = prev.findIndex((itm) => itm.id === targetId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = localItem;
          return updated;
        }
        return [...prev, localItem];
      });

      setEditItem(null);
      setActiveTab('rekap');
      alert('Koneksi offline. Data disimpan lokal di perangkat ini dan akan diunggah otomatis saat jaringan terhubung.');
      return;
    }

    try {
      await saveHuntapRecord(itemData);

      if (itemData.id) {
        await writeAuditLog(
          currentUser,
          'Modifikasi Data',
          `Memperbarui No Rumah: ${itemData.nomorRumah} (Keluarga ${itemData.nama})`
        );
      } else {
        await writeAuditLog(
          currentUser,
          'Tambah Data',
          `Menambahkan Penerima Baru: ${itemData.nama} di unit No ${itemData.nomorRumah}`
        );
      }

      setEditItem(null);
      setActiveTab('rekap');
      alert('Sukses! Data berhasil diamankan langsung di Cloud.');
    } catch (err) {
      console.warn("Gagal menyimpan ke cloud, beralih ke mode offline: ", err);
      const targetId = itemData.id || `offline-${Date.now()}`;
      const localItem = { ...itemData, id: targetId };
      setPendingSaves((prev) => [...prev, localItem]);
      setEditItem(null);
      setActiveTab('rekap');
      alert('Gagal menyimpan online. Perubahan disimpan offline pada perangkat ini.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (currentUser !== 'admin') {
      alert('Akses Ditolak! Hanya akun Administrator yang bisa menghapus data.');
      return;
    }

    const targetItem = displayData.find((item) => item.id === id);
    if (!targetItem) return;

    if (confirm(`Apakah Anda yakin ingin menghapus data milik ${targetItem.nama} secara permanen?`)) {
      if (!isOnline) {
        if (id.startsWith('offline-')) {
          setPendingSaves((prev) => prev.filter((itm) => itm.id !== id));
        } else {
          setPendingDeletes((prev) => [...prev, id]);
        }
        alert('Koneksi offline. Perubahan hapus disimpan lokal dan disinkronkan kemudian.');
        return;
      }

      try {
        // Hapus foto-foto terkait dari Cloudinary secara otomatis
        const photosToDelete = [
          targetItem.fotoRumah,
          targetItem.fotoKtpKk,
          targetItem.fotoDokTanah,
          targetItem.fotoShm,
        ].filter((url) => typeof url === 'string' && url.trim().length > 0);

        if (photosToDelete.length > 0) {
          Promise.allSettled(
            photosToDelete.map((photoUrl) => deleteFromCloudinary(photoUrl))
          ).then((results) => {
            console.log('Proses penghapusan aset gambar di Cloudinary otomatis selesai:', results);
          });
        }

        await deleteHuntapRecord(id);
        await writeAuditLog(
          currentUser,
          'Hapus Data',
          `Menghapus data KK ${targetItem.nama} (Unit No: ${targetItem.nomorRumah})`
        );
        alert('Data berhasil dihapus dari cloud.');
      } catch (err) {
        console.warn("Gagal menghapus online, ditunda ke offline: ", err);
        if (id.startsWith('offline-')) {
          setPendingSaves((prev) => prev.filter((itm) => itm.id !== id));
        } else {
          setPendingDeletes((prev) => [...prev, id]);
        }
        alert('Gagal menghapus online. Penghapusan disimpan ke antrean offline.');
      }
    }
  };

  const handleEditItemTrigger = (item: PenerimaHuntap) => {
    setEditItem(item);
    setActiveTab('input');
  };

  const handleCancelEditing = () => {
    setEditItem(null);
    setActiveTab('rekap');
  };

  const handleViewCoordinate = (id: string) => {
    setFocusId(id);
    setActiveTab('peta');
    // Clear the focus marker after small fly transition completes
    setTimeout(() => {
      setFocusId(null);
    }, 4000);
  };

  const handleQuickFilterTrigger = (field: string, value: string) => {
    setQuickFilter({ field, value });
    setActiveTab('rekap');
  };

  const handleClearLogs = async () => {
    if (currentUser !== 'admin') {
      alert('Hanya Administrator yang memiliki wewenang untuk membersihkan log audit.');
      return;
    }
    if (confirm('Bersihkan riwayat audit log aktivitas di Firestore secara permanen?')) {
      try {
        await clearAllAuditLogs();
        await writeAuditLog(
          currentUser,
          'Dibersihkan',
          'Administrator membersihkan seluruh audit log pendataan.'
        );
        alert('Log audit berhasil diatur ulang.');
      } catch (err) {
        alert(`Gagal membersihkan log: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (currentUser !== 'admin') {
      alert('Hanya Administrator yang memiliki wewenang untuk menghapus log audit.');
      return;
    }
    try {
      await deleteAuditLog(id);
    } catch (err) {
      alert(`Gagal menghapus log: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <SmartphoneShell currentUser={currentUser} onChangeUser={setCurrentUser}>
      <style>{lightThemeStyles}</style>
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${!isDarkMode ? 'light-mode-container' : 'dark-mode-container'}`}>
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
            {/* Embedded Dark/Light Mode toggle for login view */}
            <div className="px-4 py-3 flex justify-end">
              <button
                onClick={toggleTheme}
                className="bg-slate-800 border border-slate-750 hover:bg-slate-755 text-slate-300 p-2.5 rounded-xl cursor-pointer"
                title="Toggle Mode Layar"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
            <LoginView onLogin={handleLogin} onLoginAsGuest={handleLoginAsGuest} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Real-time Admin Notification Box */}
            {currentUser === 'admin' && newLogNotification && (
              <div className="absolute top-16 left-4 right-4 z-50 bg-slate-900 border border-teal-500/50 p-3.5 rounded-2xl shadow-xl animate-notification-slide flex items-start gap-3 transition-all">
                <div className="bg-teal-500/10 text-teal-400 p-2 rounded-xl shrink-0 mt-0.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-teal-400 uppercase tracking-wider block">Notifikasi Log Aktivitas</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-yellow-400/15 text-yellow-500 rounded-md border border-yellow-500/20">Admin Only</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-100 mt-1">
                    {newLogNotification.user === 'admin' ? '🛡️ Admin' : `✏️ ${newLogNotification.user}`}
                  </h4>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-bold animate-pulse">
                    Aksi: <span className="text-amber-500 font-extrabold">{newLogNotification.aksi}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 italic font-medium leading-relaxed bg-slate-850/50 p-2 rounded-lg border border-slate-750/70">
                    "{newLogNotification.rincian}"
                  </p>
                </div>
                <button
                  onClick={() => setNewLogNotification(null)}
                  className="text-slate-400 hover:text-slate-100 font-black text-xs p-1 cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            )}

            {/* App Body Content Container (Scrollable Workspace) */}
            <div className="flex-1 overflow-y-auto pb-24">
              {/* Top Header Navigation Panel for Branding display */}
              <div className="bg-slate-900 border-b border-slate-850 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                    B
                  </div>
                  <div>
                    <h1 className="text-xs font-black text-slate-100 flex items-center gap-1">
                      Portal Huntap <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    </h1>
                    <p className="text-[10px] text-slate-405 font-bold">Kabupaten Bima, NTB</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isOnline && (
                    <span className="bg-rose-500/10 text-rose-400 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-500/25 animate-pulse">
                      Mode Offline
                    </span>
                  )}
                  {isSyncing && (
                    <span className="bg-teal-500/10 text-teal-400 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border border-teal-500/25 animate-bounce">
                      Sinkronisasi...
                    </span>
                  )}

                  {/* Theme Switch Button */}
                  <button
                    onClick={toggleTheme}
                    className="p-1 px-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 rounded-lg cursor-pointer"
                    title="Ubah Mode Tampilan"
                  >
                    {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-800" />}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-rose-400 rounded-lg cursor-pointer flex items-center gap-1 px-2 text-[9px] font-extrabold"
                    title="Keluar"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>

              {/* Tab view controller selection mapping */}
              {activeTab === 'beranda' && (
                <DashboardView
                  data={displayData}
                  onQuickFilter={handleQuickFilterTrigger}
                  onSeed={handleSeedMockData}
                  seeding={seeding}
                />
              )}

        {activeTab === 'input' && (
          <InputView
            editItem={editItem}
            onSave={handleSaveItem}
            onCancelEdit={handleCancelEditing}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'rekap' && (
          <RekapView
            data={displayData}
            onEdit={handleEditItemTrigger}
            onDelete={handleDeleteItem}
            onViewMap={handleViewCoordinate}
            onSelectDetail={setSelectedDetail}
            initialFilterField={quickFilter.field}
            initialFilterValue={quickFilter.value}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'peta' && <PetaView data={displayData} focusId={focusId} />}

        {activeTab === 'riwayat' && (
          <RiwayatView
            logs={logsList}
            onClearLogs={currentUser === 'admin' ? handleClearLogs : undefined}
            onDeleteLog={currentUser === 'admin' ? handleDeleteLog : undefined}
            currentUser={currentUser}
          />
        )}
      </div>

            {/* Floating Bottom Nav-Bar Tabs */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-850 py-3.5 px-2.5 flex justify-around items-center z-40 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
              {[
                { id: 'beranda', label: 'Beranda', icon: <Home className="w-5 h-5" /> },
                { id: 'input', label: 'Input', icon: <ClipboardList className="w-5 h-5" /> },
                { id: 'rekap', label: 'Rekap', icon: <FileText className="w-5 h-5" /> },
                { id: 'peta', label: 'Peta', icon: <Map className="w-5 h-5" /> },
                showLogsTab ? { id: 'riwayat', label: 'Audit', icon: <Database className="w-5 h-5" /> } : null,
              ]
                .filter((t): t is NonNullable<typeof t> => t !== null)
                .map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        // Clear filters when going into specific tabs as requested
                        if (tab.id !== 'rekap') {
                          setQuickFilter({ field: '', value: '' });
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 transition-all relative px-1 py-0.5 ${
                        isActive ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <div className="relative">
                        {tab.icon}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-black tracking-wide">{tab.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-Up Detail Sheet Overlay rendering */}
      {selectedDetail && (
        <div className={!isDarkMode ? 'light-mode-container' : ''}>
          <DetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
        </div>
      )}
    </SmartphoneShell>
  );
}
