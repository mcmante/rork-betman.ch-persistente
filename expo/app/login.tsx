import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, t, login, isDark } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await login(data.token, data.user);
      router.replace('/(tabs)');
    },
    onError: (err) => {
      setError(err.message || t.auth.invalidCredentials);
    },
  });

  const handleLogin = () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError(t.auth.invalidCredentials);
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#1E40AF', '#3B82F6', '#1E40AF']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <Logo size="large" />
            <Text style={styles.title}>{t.auth.loginTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
            <Input
              label={t.auth.username}
              value={username}
              onChangeText={setUsername}
              placeholder={t.auth.username}
              testID="username-input"
            />
            <Input
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth.password}
              secureTextEntry
              testID="password-input"
            />

            {error ? (
              <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
            ) : null}

            <Button
              title={t.auth.login}
              onPress={handleLogin}
              loading={loginMutation.isPending}
              testID="login-button"
              style={styles.loginButton}
            />

            <Text style={[styles.hint, { color: theme.textMuted }]}>
              {t.auth.passwordPolicy}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
