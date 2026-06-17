/**
 * Compatibility barrel re-export for screens that import from `services/firebase`.
 * The app originally referenced `../../services/firebase`; this module proxies those
 * exports through `services/index` so the bundle resolves correctly.
 */

export {
  createInvoice,
  getAdminMessagesSummary,
  getAllClients,
  getCaseById,
  getCaseEvents,
  getCases,
  getClientById,
  getDocuments,
  getInquiries,
  getInspections,
  getInvoices,
  getMessages,
  markMessagesRead,
  sendMessage,
} from './index';
