
export enum Department {
  RPL = 'RPL',
  DKV = 'DKV',
  TKJ = 'TKJ',
  TPM = 'TPM',
  TPL = 'TPL',
  TKR = 'TKR',
  TAB = 'TAB',
  TSM = 'TSM',
  TBO = 'TBO'
}

export enum ToolStatus {
  AVAILABLE = 'Tersedia',
  BORROWED = 'Dipinjam',
  MAINTENANCE = 'Perbaikan',
  LOST = 'Hilang'
}

export enum LendingStatus {
  PENDING = 'Menunggu',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak',
  RETURNED = 'Dikembalikan'
}

export interface Tool {
  id: string;
  name: string;
  department: Department;
  quantity: number;
  availableQuantity: number;
  status: ToolStatus;
  location: string;
  image?: string;
  notes?: string;
}

export interface LendingRecord {
  id: string;
  toolId: string;
  toolName: string;
  studentName: string;
  studentClass: string;
  department: Department;
  borrowDate: string;
  returnDate?: string;
  status: LendingStatus;
  notes?: string;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'KAJUR' | 'STUDENT';
  department?: Department;
}
