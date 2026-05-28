import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { PenerimaHuntap, UserLog } from './types';

// User's explicit Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxeGYTWxy-aeLEmDsWUn4oEDf4-bO80_g",
  authDomain: "aplikasi-huntap.firebaseapp.com",
  projectId: "aplikasi-huntap",
  storageBucket: "aplikasi-huntap.firebasestorage.app",
  messagingSenderId: "913800740835",
  appId: "1:913800740835:web:faa96a58330ed3c1a4aad6",
  measurementId: "G-H67RPCT2SZ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

// Verification Operation Types
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Raised:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate relationship connection when booting up
export async function testConnection() {
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection Verified: Success.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.warn("Bootstrap test connection bypassed or completed: ", error);
    }
  }
}

// Real-Time Listener for Huntap Data
export function streamHuntapData(
  onData: (data: PenerimaHuntap[]) => void,
  onError: (error: Error) => void
) {
  const pathName = 'huntap_data';
  const q = query(collection(db, pathName));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PenerimaHuntap[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        items.push({
          id: snap.id,
          nomorRumah: d.nomorRumah || '',
          nama: d.nama || '',
          kecamatan: d.kecamatan || '',
          desa: d.desa || '',
          luas: typeof d.luas === 'number' ? d.luas : null,
          dokumenTanah: d.dokumenTanah || '',
          terimaSertipikat: d.terimaSertipikat === 'Sudah' ? 'Sudah' : 'Belum',
          noHp: d.noHp || '',
          koordinat: d.koordinat || '',
          keterangan: d.keterangan || '',
          fotoRumah: d.fotoRumah || '',
          fotoKtpKk: d.fotoKtpKk || '',
          fotoDokTanah: d.fotoDokTanah || '',
          fotoShm: d.fotoShm || '',
        } as PenerimaHuntap);
      });
      // Sort nicely on client by nomorRumah alphanumeric natural sorted style
      items.sort((a, b) => a.nomorRumah.localeCompare(b.nomorRumah, undefined, { numeric: true, sensitivity: 'base' }));
      onData(items);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.GET, pathName);
    }
  );
}

// Save or Create Huntap record
export async function saveHuntapRecord(itemData: Omit<PenerimaHuntap, 'id'> & { id?: string }) {
  const pathName = 'huntap_data';
  const { id, ...data } = itemData;

  try {
    if (id) {
      await setDoc(doc(db, pathName, id), data, { merge: true });
    } else {
      await addDoc(collection(db, pathName), data);
    }
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, `${pathName}/${id || ''}`);
  }
}

// Delete Huntap record
export async function deleteHuntapRecord(id: string) {
  const pathName = 'huntap_data';
  try {
    await deleteDoc(doc(db, pathName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${pathName}/${id}`);
  }
}

// Real-Time Audit Log Listener
export function streamAuditLogs(
  onLogs: (logs: UserLog[]) => void,
  onError: (error: Error) => void
) {
  const pathName = 'huntap_logs';
  const q = query(collection(db, pathName), orderBy('waktu', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: UserLog[] = [];
      snapshot.forEach((snap) => {
        const d = snap.data();
        let formattedTime = d.waktu;
        if (d.waktu && typeof d.waktu.toDate === 'function') {
          formattedTime = d.waktu.toDate().toISOString();
        }
        logs.push({
          id: snap.id,
          user: d.user || 'Unknown User',
          aksi: d.aksi || 'Aksi',
          detail: d.detail || '',
          waktu: formattedTime || new Date().toISOString(),
        } as UserLog);
      });
      onLogs(logs);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, pathName);
    }
  );
}

// Write Audit Log
export async function writeAuditLog(user: string, aksi: string, detail: string) {
  const pathName = 'huntap_logs';
  try {
    await addDoc(collection(db, pathName), {
      user,
      aksi,
      detail,
      waktu: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to write audit log in Firestore:', error);
  }
}

// Clear all audit logs physically from Firestore
export async function clearAllAuditLogs() {
  const pathName = 'huntap_logs';
  try {
    const qSnapshot = await getDocs(collection(db, pathName));
    const deletePromises: Promise<void>[] = [];
    qSnapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, pathName, docSnap.id)));
    });
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathName);
  }
}

// Delete an individual audit log
export async function deleteAuditLog(id: string) {
  const pathName = 'huntap_logs';
  try {
    await deleteDoc(doc(db, pathName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${pathName}/${id}`);
  }
}

