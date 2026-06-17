export {
  getClientsPaginated,
  getClientById,
  createClient,
  updateClientLastMessage,
  getAllClients,
  getAdminMessagesSummary,
  getAdminMessagesSummaryPaginated,
  getClientsRealtime,
  Client,
  PaginatedResult,
} from './clients';
export {
  getCases,
  getCasesPaginated,
  getCasesRealtime,
  getCaseById,
  createCase,
  updateCaseProgress,
  updateCase,
  getCaseEvents,
  getCaseEventsPaginated,
  addCaseEvent,
  getCaseByIdRealtime,
  getCaseEventsRealtime,
  Case,
  CaseEvent,
} from './cases';
export {
  getDocuments,
  getDocumentsPaginated,
  DocumentItem,
  ScanStatus,
  ScanDocumentResult,
  uploadDocument,
  updateDocumentScanStatus,
} from './documents';
export {getInvoices, getInvoicesPaginated, createInvoice, Invoice} from './invoices';
export {
  getInspections,
  getInspectionsPaginated,
  getInspectionById,
  Inspection,
} from './inspections';
export {
  getMessagesRealtime as getMessages,
  sendMessage,
  markMessagesRead,
  Message,
} from './messages';
export {getInquiries, getInquiriesPaginated, submitInquiry, Inquiry} from './inquiries';
export {payInvoice, openPaymentUrl, PaymentGateway} from './payments';
export * from './queries';
