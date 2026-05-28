export interface PenerimaHuntap {
  id: string;
  nomorRumah: string;
  nama: string;
  kecamatan: string;
  desa: string;
  luas: number | null;
  dokumenTanah: string;
  terimaSertipikat: 'Sudah' | 'Belum';
  noHp: string;
  koordinat: string; // "latitude, longitude"
  keterangan: string;
  fotoRumah?: string;
  fotoKtpKk?: string;
  fotoDokTanah?: string;
  fotoShm?: string;
}

export interface UserLog {
  id: string;
  user: string;
  aksi: string;
  detail: string;
  waktu: string; // ISO String
}
