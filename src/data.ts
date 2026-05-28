import { PenerimaHuntap, UserLog } from './types';

export const DATA_WILAYAH: Record<string, string[]> = {
  "Ambalawi": ["Kole", "Mawu", "Nipa", "Rite", "Talapiti", "Tolowata"],
  "Belo": ["Diha", "Cenggu", "Lido", "Ncera", "Ngali", "Renda", "Roka", "Runggu", "Soki"],
  "Bolo": ["Bontokape", "Darussalam", "Kananga", "Kara", "Leu", "Nggembe", "Rada", "Rasabau", "Rato", "Sanolo", "Sondosia", "Tambe", "Timu", "Tumpu"],
  "Donggo": ["Bumi Pajo", "Doridungga", "Kala", "Mbawa", "Mpili", "Ndano Na'e", "O'o", "Palama", "Rora"],
  "Lambitu": ["Kaboro", "Kaowa", "Kuta", "Londu", "Sambori", "Teta"],
  "Lambu": ["Hidirasa", "Kaleo", "Lambu", "Lanta", "Lanta Barat", "Mangge", "Melayu", "Monta Baru", "Nggelu", "Rato", "Sangga", "Simpasai", "Soro", "Sumi"],
  "Langgudu": ["Doro O'o", "Dumu", "Kalodu", "Kangga", "Karampi", "Karumbu", "Kawuwu", "Laju", "Pusu", "Rompo", "Rupe", "Sambane", "Sarae Ruma", "Wadu Ruka", "Waworada"],
  "Mada Pangga": ["Bolo", "Campa", "Dena", "Mandawau", "Monggo", "Mpuri", "Ncandi", "Ndano", "Rade", "Tonda", "Woro"],
  "Monta": ["Baralau", "Monta", "Nontotera", "Pela", "Sekuru", "Sie", "Simpasai", "Sondo", "Tangga", "Tangga Baru", "Tolotangga", "Tolouwi", "Waro", "Willamaci"],
  "Palibelo": ["Belo", "Bre", "Dore", "Nata", "Ntonggu", "Padolo", "Panda", "Roka", "Teke", "Tonggorisa"],
  "Parado": ["Kanca", "Kuta", "Lere", "Parado Rato", "Parado Wane"],
  "Sanggar": ["Boro", "Kore", "Oi Saro", "Piong", "Sandue", "Taloko"],
  "Sape": ["Bajo Pulo", "Boke", "Bugis", "Buncu", "Jia", "Kowo", "Lamere", "Nae", "Naru Barat", "Naru Timur", "Oi Maci", "Parangina", "Poja", "Rai Oi", "Rasabau", "Sangia", "Sari"],
  "Soromandi": ["Bajo", "Campaka", "Kanakanga", "Punti", "Sai", "Sampungu"],
  "Tambora": ["Kawia", "Labuhan Kananga", "Oi Bura", "Oi Panihi", "Rasabou"],
  "Wawo": ["Kambilo", "Kombo", "Maria", "Maria Utara", "Ntori", "Pesa", "Raba", "Riamau", "Tarlawi"],
  "Wera": ["Bala", "Hidirasa", "Kalajena", "Mandala", "Nanga Wera", "Ntoke", "Nunggi", "Oi Tui", "Pai", "Ranggasolo", "Sangiang", "Tadewa", "Tawali", "Wora"],
  "Woha": ["Donggobolo", "Kalampa", "Keli", "Naru", "Nisa", "Pandai", "Penapali", "Rabakodo", "Risa", "Samili", "Tenga", "Talabiu", "Tente", "Waduwani"]
};

export const INITIAL_HUN_DATA: PenerimaHuntap[] = [
  {
    id: "h-1",
    nomorRumah: "A.01",
    nama: "Budi Ansan",
    kecamatan: "Bolo",
    desa: "Sanolo",
    luas: 120,
    dokumenTanah: "SHM Nomor 102",
    terimaSertipikat: "Sudah",
    noHp: "081234567890",
    koordinat: "-8.5134, 118.6812",
    keterangan: "Penerima manfaat langsung, diserahkan oleh Bupati.",
    fotoRumah: "https://images.unsplash.com/photo-1570129476815-ba368ac77013?auto=format&fit=crop&w=600&q=80",
    fotoKtpKk: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
    fotoDokTanah: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
    fotoShm: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "h-2",
    nomorRumah: "B.12",
    nama: "Nurhasanah",
    kecamatan: "Woha",
    desa: "Tente",
    luas: 100,
    dokumenTanah: "Sporadik Desa 2019",
    terimaSertipikat: "Belum",
    noHp: "082345678121",
    koordinat: "-8.5392, 118.7214",
    keterangan: "Dalam proses pengurusan sengketa batas timur.",
    fotoRumah: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "h-3",
    nomorRumah: "C.04",
    nama: "Syamsudin",
    kecamatan: "Sape",
    desa: "Bugis",
    luas: 150,
    dokumenTanah: "Surat Hibah Keluarga",
    terimaSertipikat: "Sudah",
    noHp: "085293812849",
    koordinat: "-8.5671, 119.0012",
    keterangan: "Status tanah clear, tidak ada kendala fisik.",
    fotoRumah: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    fotoKtpKk: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "h-4",
    nomorRumah: "D.08",
    nama: "Faisal",
    kecamatan: "Lambu",
    desa: "Kaleo",
    luas: 110,
    dokumenTanah: "Sporadik Desa 2021",
    terimaSertipikat: "Belum",
    noHp: "082294823901",
    koordinat: "-8.5812, 119.0411",
    keterangan: "Berkas sudah masuk BPN, menunggu giliran pengukuran.",
    fotoRumah: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "h-5",
    nomorRumah: "E.15",
    nama: "Rosdiana",
    kecamatan: "Wawo",
    desa: "Maria",
    luas: 95,
    dokumenTanah: "AJB No. 44/2017",
    terimaSertipikat: "Sudah",
    noHp: "087812839481",
    koordinat: "-8.4912, 118.8214",
    keterangan: "Diserahkan langsung oleh tim BPN tingkat II.",
    fotoRumah: "https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=600&q=80",
    fotoShm: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"
  }
];

export const INITIAL_LOGS_DATA: UserLog[] = [
  {
    id: "l-1",
    user: "Admin",
    aksi: "Inisialisasi Sistem",
    detail: "Sistem pendataan Huntap Kab. Bima Mobile aktif secara realtime.",
    waktu: "2026-05-28T08:00:00Z"
  },
  {
    id: "l-2",
    user: "budiansani@gmail.com",
    aksi: "Login",
    detail: "Pengguna berhasil masuk ke sistem melalui portal seluler.",
    waktu: "2026-05-28T08:20:00Z"
  }
];
