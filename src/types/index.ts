import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

export type FirestoreTimestamp =
  | FirebaseFirestoreTypes.Timestamp
  | Date
  | string;

// ---------------------------------------------------------------------------
// Domain: Lawyer
// ---------------------------------------------------------------------------

export interface Lawyer {
  id: string;
  uid: string;
  name?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Client
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Case
// ---------------------------------------------------------------------------

export interface Case {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: CaseEvent
// ---------------------------------------------------------------------------

export interface CaseEvent {
  id: string;
  type?: string;
  actor?: string;
  text?: string;
  date?: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Document
// ---------------------------------------------------------------------------

export interface Document {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
  uploadedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Invoice
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  title?: string;
  amount?: number;
  status: InvoiceStatus;
  description?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Inspection
// ---------------------------------------------------------------------------

export type InspectionStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending';

export interface Inspection {
  id: string;
  title?: string;
  status?: InspectionStatus;
  dateStart?: FirestoreTimestamp;
  dateEnd?: FirestoreTimestamp;
  location?: string;
  notes?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Domain: Message
// ---------------------------------------------------------------------------

export type MessageFrom = 'client' | 'lawyer' | 'system';

export interface Message {
  id: string;
  text: string;
  from: MessageFrom;
  timestamp?: FirestoreTimestamp;
  read?: boolean;
}

// ---------------------------------------------------------------------------
// Domain: Inquiry
// ---------------------------------------------------------------------------

export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Inquiry {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  subject?: string;
  message?: string;
  status: InquiryStatus;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  uid: string;
  phoneNumber?: string | null;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  initializing: boolean;
  isLawyer: boolean;
  loginWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  confirmCode: (code: string) => Promise<FirebaseAuthTypes.UserCredential>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Navigation param lists
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Login: undefined;
  ClientRoot: undefined;
  AdminRoot: undefined;
};

export type ClientTabParamList = {
  Home: undefined;
  Cases: undefined;
  Inspections: undefined;
  Registry: undefined;
  Bureau: undefined;
};

export type ClientStackParamList = {
  MyCases: undefined;
  CaseDetail: {clientId: string; caseId: string};
  MyDocuments: {clientId: string; caseId: string};
  ScannerScreen: {clientId: string; caseId: string};
  MyInvoices: {clientId: string};
  Chat: {clientId: string};
  DiiaSign: {
    clientId: string;
    caseId: string;
    documentId: string;
    documentName: string;
    documentHash: string;
    onComplete?: (signature: any) => void;
  };
  SignResult: {success: boolean; signature?: any; reason?: string};
};

export type RegistryStackParamList = {
  Registries: undefined;
  RegistryDetail: {type: 'edr' | 'court' | 'enforcement'; data: any};
};

export type InspectionStackParamList = {
  MyInspections: undefined;
  InspectionDetail: {clientId: string; inspectionId: string};
};

export type BureauStackParamList = {
  Bureau: undefined;
  Chat: {clientId: string};
};

export type AdminTabParamList = {
  AdminHome: undefined;
  Clients: undefined;
  AdminChats: undefined;
};

export type AdminStackParamList = {
  ClientsList: undefined;
  AdminClientDetail: {clientId: string};
  AdminCaseDetail: {clientId: string; caseId: string};
  CreateInvoice: {clientId: string};
  AdminChatDetail: {clientId: string};
};

export type AdminChatStackParamList = {
  ClientsList: undefined;
  AdminChatDetail: {clientId: string};
};
