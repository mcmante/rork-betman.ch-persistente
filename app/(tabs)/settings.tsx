import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Moon, Sun, Smartphone, Heart, Lock, LogOut, ChevronRight, Check } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TeamFlag } from '@/components/TeamFlag';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, t, user, language, themeMode, setLanguage, setThemeMode, logout, updateUser } = useApp();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const teamsQuery = trpc.teams.list.useQuery();
  const updatePrefsMutation = trpc.auth.updatePreferences.useMutation({
    onSuccess: (data) => {
      updateUser(data);
    },
  });
  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      Alert.alert(t.common.success, t.auth.changePassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const favoriteTeam = teamsQuery.data?.find(t => t.id === user?.favoriteTeamId);

  const handleLanguageChange = async (lang: 'it' | 'en') => {
    await setLanguage(lang);
    updatePrefsMutation.mutate({ preferredLanguage: lang });
    setShowLanguagePicker(false);
  };

  const handleThemeChange = async (mode: 'light' | 'dark' | 'system') => {
    await setThemeMode(mode);
    updatePrefsMutation.mutate({ preferredTheme: mode });
    setShowThemePicker(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleLogout = () => {
    Alert.alert(
      t.auth.logout,
      '',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return <Sun size={22} color={theme.primary} />;
      case 'dark': return <Moon size={22} color={theme.primary} />;
      default: return <Smartphone size={22} color={theme.primary} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Logo size="small" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t.settings.title}</Text>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.settings.account}</Text>
        
        <Card style={styles.card}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[styles.username, { color: theme.text }]}>{user?.username}</Text>
              <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {user?.role === 'PLAYER' && (
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => !favoriteTeam && router.push('/favorite-team')}
              disabled={!!favoriteTeam}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
                <Heart size={22} color={theme.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{t.settings.favoriteTeam}</Text>
                {favoriteTeam ? (
                  <View style={styles.favoriteTeamRow}>
                    <TeamFlag url={favoriteTeam.flagImageUrl} size={20} />
                    <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                      {favoriteTeam.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.settingValue, { color: theme.primary }]}>
                    {t.settings.selectFavoriteTeam}
                  </Text>
                )}
              </View>
              {!favoriteTeam && <ChevronRight size={20} color={theme.textMuted} />}
            </TouchableOpacity>
          </Card>
        )}

        <Card style={styles.card}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            onPress={() => setShowLanguagePicker(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Globe size={22} color={theme.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.settings.language}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t.settings.languages[language]}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowThemePicker(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
              {getThemeIcon()}
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.settings.theme}</Text>
              <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                {t.settings.themes[themeMode]}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <Lock size={22} color={theme.secondary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>{t.auth.changePassword}</Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error + '15' }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>{t.auth.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showLanguagePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.language}</Text>
            {(['en', 'it'] as const).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {t.settings.languages[lang]}
                </Text>
                {language === lang && <Check size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
            <Button title={t.common.cancel} onPress={() => setShowLanguagePicker(false)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showThemePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.settings.theme}</Text>
            {(['light', 'dark', 'system'] as const).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                onPress={() => handleThemeChange(mode)}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {t.settings.themes[mode]}
                </Text>
                {themeMode === mode && <Check size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
            <Button title={t.common.cancel} onPress={() => setShowThemePicker(false)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.auth.changePassword}</Text>
            <Input
              label={t.auth.currentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <Input
              label={t.auth.newPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={[styles.hint, { color: theme.textMuted }]}>{t.auth.passwordPolicy}</Text>
            <View style={styles.modalActions}>
              <Button title={t.common.cancel} onPress={() => setShowPasswordModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button title={t.common.save} onPress={handleChangePassword} loading={changePasswordMutation.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 12, alignItems: 'center' },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: '700' as const, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  card: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' as const },
  username: { fontSize: 17, fontWeight: '600' as const },
  email: { fontSize: 14, marginTop: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1, marginLeft: 14 },
  settingLabel: { fontSize: 16, fontWeight: '500' as const },
  settingValue: { fontSize: 14, marginTop: 2 },
  favoriteTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10, marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: '600' as const },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  optionText: { fontSize: 16 },
  hint: { fontSize: 12, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
