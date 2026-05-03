import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getClientsPaginated,
  getClientById,
  createClient,
  getAllClients,
  getAdminMessagesSummary,
  getAdminMessagesSummaryPaginated,
  getClientsRealtime,
  Client,
} from '../services/clients';
import {
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
} from '../services/cases';
import {
  getDocumentsPaginated,
  uploadDocument,
} from '../services/documents';
import {
  getInvoicesPaginated,
  createInvoice,
  Invoice,
} from '../services/invoices';
import {
  getInspectionsPaginated,
  getInspectionById,
} from '../services/inspections';
import {
  getInquiriesPaginated,
  submitInquiry,
} from '../services/inquiries';
import {
  getMessagesRealtime,
  sendMessage,
  markMessagesRead,
  Message,
} from '../services/messages';
import {getSignaturesRealtime, SignatureRecord} from '../services/signatures';
import {useEffect, useRef, useState} from 'react';

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientById(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClientsInfinite() {
  return useInfiniteQuery({
    queryKey: ['clients'],
    queryFn: ({pageParam}) => getClientsPaginated(pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
  });
}

export function useClientsRealtime(
  limitCount: number = 100,
  enabled: boolean = true,
  debounceMs: number = 300,
) {
  const [data, setData] = useState<Client[] | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    const unsub = getClientsRealtime(clients => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setData(clients);
        setIsFetching(false);
        setError(null);
      }, debounceMs);
    }, limitCount);
    return () => {
      unsub();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [limitCount, enabled, debounceMs]);

  return {data, isFetching, error};
}

export function useAllClients() {
  return useQuery({
    queryKey: ['allClients'],
    queryFn: getAllClients,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminMessagesSummary() {
  return useQuery({
    queryKey: ['adminMessagesSummary'],
    queryFn: getAdminMessagesSummary,
    staleTime: 1000 * 60 * 1,
  });
}

export function useAdminMessagesSummaryPaginated() {
  return useInfiniteQuery({
    queryKey: ['adminMessagesSummary'],
    queryFn: ({pageParam}) => getAdminMessagesSummaryPaginated(pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['clients']});
      qc.invalidateQueries({queryKey: ['allClients']});
    },
  });
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export function useCase(
  clientId: string | undefined,
  caseId: string | undefined,
) {
  return useQuery({
    queryKey: ['case', clientId, caseId],
    queryFn: () => getCaseById(clientId!, caseId!),
    enabled: !!clientId && !!caseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCasesRealtime(
  clientId: string | undefined,
  enabled: boolean = true,
) {
  const [data, setData] = useState<Case[] | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !clientId) {
      setData(undefined);
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    const unsub = getCasesRealtime(clientId, cases => {
      setData(cases);
      setIsFetching(false);
      setError(null);
    });
    return () => {
      unsub();
    };
  }, [clientId, enabled]);

  return {data, isFetching, error};
}

export function useCasesInfinite(clientId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['cases', clientId],
    queryFn: ({pageParam}) => getCasesPaginated(clientId!, pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
    enabled: !!clientId,
  });
}

export function useCaseEvents(
  clientId: string | undefined,
  caseId: string | undefined,
) {
  return useQuery({
    queryKey: ['caseEvents', clientId, caseId],
    queryFn: () => getCaseEvents(clientId!, caseId!),
    enabled: !!clientId && !!caseId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCaseEventsPaginated(
  clientId: string | undefined,
  caseId: string | undefined,
) {
  return useInfiniteQuery({
    queryKey: ['caseEvents', clientId, caseId],
    queryFn: ({pageParam}) =>
      getCaseEventsPaginated(clientId!, caseId!, pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
    enabled: !!clientId && !!caseId,
  });
}

export function useUpdateCaseProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      caseId,
      progress,
    }: {
      clientId: string;
      caseId: string;
      progress: number;
    }) => updateCaseProgress(clientId, caseId, progress),
    onMutate: async ({clientId, caseId, progress}) => {
      const queryKey = ['case', clientId, caseId];
      await qc.cancelQueries({queryKey});
      const previous = qc.getQueryData<Case>(queryKey);
      if (previous) {
        qc.setQueryData(queryKey, {...previous, progress});
      }
      return {previous};
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['case', vars.clientId, vars.caseId], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({queryKey: ['case', vars.clientId, vars.caseId]});
      qc.invalidateQueries({queryKey: ['cases', vars.clientId]});
    },
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string;
      data: Omit<Case, 'id' | 'createdAt' | 'progress' | 'status'>;
    }) => createCase(clientId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({queryKey: ['cases', vars.clientId]});
    },
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      caseId,
      data,
    }: {
      clientId: string;
      caseId: string;
      data: Partial<Case>;
    }) => updateCase(clientId, caseId, data),
    onMutate: async ({clientId, caseId, data}) => {
      const queryKey = ['case', clientId, caseId];
      await qc.cancelQueries({queryKey});
      const previous = qc.getQueryData<Case>(queryKey);
      if (previous) {
        qc.setQueryData(queryKey, {...previous, ...data});
      }
      return {previous};
    },
    onError: (_err, vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['case', vars.clientId, vars.caseId], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({queryKey: ['case', vars.clientId, vars.caseId]});
      qc.invalidateQueries({queryKey: ['cases', vars.clientId]});
    },
  });
}

export function useAddCaseEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      caseId,
      eventData,
    }: {
      clientId: string;
      caseId: string;
      eventData: Omit<CaseEvent, 'id' | 'date'>;
    }) => addCaseEvent(clientId, caseId, eventData),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['caseEvents', vars.clientId, vars.caseId],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Realtime listeners (bridge onSnapshot → RQ cache)
// ---------------------------------------------------------------------------

export function useCaseByIdRealtime(
  clientId: string | undefined,
  caseId: string | undefined,
  enabled: boolean = true,
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || !clientId || !caseId) {
      return;
    }
    const unsub = getCaseByIdRealtime(clientId, caseId, caseData => {
      qc.setQueryData(['case', clientId, caseId], caseData);
    });
    return unsub;
  }, [clientId, caseId, enabled, qc]);
}

export function useCaseEventsRealtime(
  clientId: string | undefined,
  caseId: string | undefined,
  enabled: boolean = true,
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || !clientId || !caseId) {
      return;
    }
    const unsub = getCaseEventsRealtime(clientId, caseId, events => {
      qc.setQueryData(['caseEvents', clientId, caseId], events);
    });
    return unsub;
  }, [clientId, caseId, enabled, qc]);
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function useDocumentsInfinite(
  clientId: string | undefined,
  caseId: string | undefined,
) {
  return useInfiniteQuery({
    queryKey: ['documents', clientId, caseId],
    queryFn: ({pageParam}) =>
      getDocumentsPaginated(clientId!, caseId!, pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
    enabled: !!clientId && !!caseId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      clientId: string;
      caseId: string;
      filePath: string;
      name: string;
      fileSize: number;
      mimeType: string;
      sha256: string;
      onProgress?: (p: number) => void;
    }) =>
      uploadDocument(
        vars.clientId,
        vars.caseId,
        vars.filePath,
        vars.name,
        vars.fileSize,
        vars.mimeType,
        vars.sha256,
        vars.onProgress,
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['documents', vars.clientId, vars.caseId],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export function useInvoicesInfinite(clientId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['invoices', clientId],
    queryFn: ({pageParam}) => getInvoicesPaginated(clientId!, pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
    enabled: !!clientId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      data,
    }: {
      clientId: string;
      data: Omit<Invoice, 'id' | 'createdAt' | 'status'>;
    }) => createInvoice(clientId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({queryKey: ['invoices', vars.clientId]});
    },
  });
}

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

export function useInspectionsInfinite(clientId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['inspections', clientId],
    queryFn: ({pageParam}) => getInspectionsPaginated(clientId!, pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
    enabled: !!clientId,
  });
}

export function useInspection(
  clientId: string | undefined,
  inspectionId: string | undefined,
) {
  return useQuery({
    queryKey: ['inspection', clientId, inspectionId],
    queryFn: () => getInspectionById(clientId!, inspectionId!),
    enabled: !!clientId && !!inspectionId,
    staleTime: 1000 * 60 * 5,
  });
}

// ---------------------------------------------------------------------------
// Messages (realtime via react-query is tricky; keep a thin wrapper)
// ---------------------------------------------------------------------------

export function useMessagesRealtime(
  clientId: string | undefined,
  callback: (messages: Message[]) => void,
  enabled: boolean = true,
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || !clientId) {
      return;
    }
    const unsub = getMessagesRealtime(clientId, messages => {
      qc.setQueryData(['messages', clientId], messages);
      callback?.(messages);
    });
    return unsub;
  }, [clientId, callback, enabled, qc]);
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      text,
      from,
    }: {
      clientId: string;
      text: string;
      from?: 'client' | 'lawyer' | 'admin';
    }) => sendMessage(clientId, text, from),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({queryKey: ['messages', vars.clientId]});
      qc.invalidateQueries({queryKey: ['adminMessagesSummary']});
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      messageIds,
    }: {
      clientId: string;
      messageIds: string[];
    }) => markMessagesRead(clientId, messageIds),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({queryKey: ['messages', vars.clientId]});
      qc.invalidateQueries({queryKey: ['adminMessagesSummary']});
    },
  });
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export function useInquiriesInfinite() {
  return useInfiniteQuery({
    queryKey: ['inquiries'],
    queryFn: ({pageParam}) => getInquiriesPaginated(pageParam),
    getNextPageParam: lastPage =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as any,
  });
}

export function useSubmitInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitInquiry,
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['inquiries']});
    },
  });
}

// ---------------------------------------------------------------------------
// Signatures realtime
// ---------------------------------------------------------------------------

export function useSignaturesRealtime(
  clientId: string | undefined,
  caseId: string | undefined,
  documentId: string | undefined,
  enabled: boolean = true,
) {
  const [data, setData] = useState<SignatureRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!enabled || !clientId || !caseId || !documentId) {
      setData([]);
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    const unsub = getSignaturesRealtime(clientId, caseId, documentId, sigs => {
      setData(sigs);
      setIsFetching(false);
    });
    return () => {
      unsub();
    };
  }, [clientId, caseId, documentId, enabled]);

  return {data, isFetching};
}
