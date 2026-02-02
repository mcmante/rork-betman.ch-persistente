import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, CheckCircle, XCircle, Server, RefreshCw, LogOut } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

export default function DbConfigScreen() {
  const { theme, t, logout } = useApp();
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [mysqlDatabase, setMysqlDatabase] = useState('betman');
  const [mysqlUsername, setMysqlUsername] = useState('root');
  const [mysqlPassword, setMysqlPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const configQuery = trpc.config.getDbConfig.useQuery();
  const connectionStringQuery = trpc.config.getConnectionString.useQuery();
  const updateMutation = trpc.config.updateDbConfig.useMutation();
  const testMutation = trpc.config.testConnection.useMutation();

  useEffect(() => {
    if (configQuery.data) {
      setMysqlHost(configQuery.data.mysqlHost);
      setMysqlPort(String(configQuery.data.mysqlPort));
      setMysqlDatabase(configQuery.data.mysqlDatabase);
      setMysqlUsername(configQuery.data.mysqlUsername);
      if (configQuery.data.mysqlPassword) {
        setMysqlPassword(configQuery.data.mysqlPassword);
      }
    }
  }, [configQuery.data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        mysqlHost,
        mysqlPort: parseInt(mysqlPort, 10) || 3306,
        mysqlDatabase,
        mysqlUsername,
        mysqlPassword,
      });
      
      if (Platform.OS === 'web') {
        alert(t.dbConfig.saved);
      } else {
        Alert.alert(t.common.success, t.dbConfig.saved);
      }
      
      configQuery.refetch();
      connectionStringQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.error;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert(t.common.error, message);
      }
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await updateMutation.mutateAsync({
        mysqlHost,
        mysqlPort: parseInt(mysqlPort, 10) || 3306,
        mysqlDatabase,
        mysqlUsername,
        mysqlPassword,
      });

      const result = await testMutation.mutateAsync();
      
      if (result.success) {
        if (Platform.OS === 'web') {
          alert(t.dbConfig.testSuccess + '\n\n' + result.message);
        } else {
          Alert.alert(t.common.success, t.dbConfig.testSuccess + '\n\n' + result.message);
        }
      } else {
        if (Platform.OS === 'web') {
          alert(t.dbConfig.testFailed + ': ' + result.message);
        } else {
          Alert.alert(t.common.error, t.dbConfig.testFailed + ': ' + result.message);
        }
      }
      
      configQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.dbConfig.testFailed;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert(t.common.error, message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const styles = createStyles(theme);

  if (configQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Database size={32} color={theme.primary} />
          <Text style={styles.title}>{t.dbConfig.title}</Text>
          <Text style={styles.subtitle}>{t.dbConfig.subtitle}</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t.dbConfig.status}:</Text>
            <View style={styles.statusBadge}>
              {configQuery.data?.isConfigured ? (
                <>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={[styles.statusText, { color: '#10B981' }]}>
                    {t.dbConfig.configured}
                  </Text>
                </>
              ) : (
                <>
                  <XCircle size={16} color="#EF4444" />
                  <Text style={[styles.statusText, { color: '#EF4444' }]}>
                    {t.dbConfig.notConfigured}
                  </Text>
                </>
              )}
            </View>
          </View>
          {configQuery.data?.lastTestAt && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t.dbConfig.lastTest}:</Text>
              <Text style={styles.statusValue}>
                {new Date(configQuery.data.lastTestAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.dbConfig.host}</Text>
            <TextInput
              style={styles.input}
              value={mysqlHost}
              onChangeText={setMysqlHost}
              placeholder="localhost"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.dbConfig.port}</Text>
            <TextInput
              style={styles.input}
              value={mysqlPort}
              onChangeText={setMysqlPort}
              placeholder="3306"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.dbConfig.database}</Text>
            <TextInput
              style={styles.input}
              value={mysqlDatabase}
              onChangeText={setMysqlDatabase}
              placeholder="betman"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.dbConfig.username}</Text>
            <TextInput
              style={styles.input}
              value={mysqlUsername}
              onChangeText={setMysqlUsername}
              placeholder="root"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.dbConfig.password}</Text>
            <TextInput
              style={styles.input}
              value={mysqlPassword}
              onChangeText={setMysqlPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Server size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t.dbConfig.save}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t.dbConfig.testConnection}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {connectionStringQuery.data && (
          <View style={styles.connectionCard}>
            <Text style={styles.connectionTitle}>{t.dbConfig.connectionString}</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText} selectable>
                {connectionStringQuery.data.connectionString}
              </Text>
            </View>

            <Text style={[styles.connectionTitle, { marginTop: 16 }]}>
              {t.dbConfig.envExample}
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText} selectable>
                {connectionStringQuery.data.envExample}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>{t.dbConfig.notes}</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <LogOut size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>{t.common.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: theme.text,
      marginTop: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    statusCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    statusValue: {
      fontSize: 14,
      color: theme.text,
    },
    formCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 10,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    testButton: {
      backgroundColor: '#10B981',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600' as const,
    },
    connectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    connectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
      marginBottom: 8,
    },
    codeBlock: {
      backgroundColor: '#1E293B',
      borderRadius: 8,
      padding: 12,
    },
    codeText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 12,
      color: '#E2E8F0',
    },
    noteCard: {
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    noteText: {
      fontSize: 13,
      color: '#92400E',
      lineHeight: 20,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 10,
      backgroundColor: '#EF4444',
      marginTop: 16,
    },
  });
