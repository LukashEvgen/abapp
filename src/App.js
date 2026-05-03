import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import SecurityGate from './components/SecurityGate';
import {activateAppCheck} from './services/appCheck';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export default function App() {
  useEffect(() => {
    activateAppCheck().catch(() => {
      // App Check activation errors are logged in service; app continues
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SecurityGate>
            <AppNavigator />
          </SecurityGate>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
