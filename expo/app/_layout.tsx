import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { trpc, trpcClient } from '@/lib/trpc';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message || 'Unknown error'}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';
    const inFavoriteTeam = segments[0] === 'favorite-team';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'PLAYER' && !user.favoriteTeamId) {
        router.replace('/favorite-team');
      } else {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && user?.role === 'PLAYER' && !user.favoriteTeamId && !inFavoriteTeam) {
      router.replace('/favorite-team');
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const { theme } = useApp();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="favorite-team" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

function AppContent() {
  const { isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthGate>
      <RootLayoutNav />
    </AuthGate>
  );
}

export default function RootLayout() {
  console.log('RootLayout rendering');
  
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
