import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, AlertTriangle } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { TeamFlag } from '@/components/TeamFlag';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function FavoriteTeamScreen() {
  const router = useRouter();
  const { theme, t, user, updateUser } = useApp();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const teamsQuery = trpc.teams.list.useQuery();
  const setFavoriteMutation = trpc.auth.setFavoriteTeam.useMutation({
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      router.replace('/(tabs)');
    },
    onError: (err) => {
      Alert.alert(t.common.error, err.message);
    },
  });

  const handleConfirm = () => {
    if (!selectedTeamId) return;
    
    Alert.alert(
      t.favoriteTeam.title,
      t.settings.favoriteTeamWarning,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: () => setFavoriteMutation.mutate({ teamId: selectedTeamId }),
        },
      ]
    );
  };

  const renderTeam = ({ item }: { item: { id: string; name: string; flagImageUrl: string } }) => {
    const isSelected = selectedTeamId === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedTeamId(item.id)}
        activeOpacity={0.7}
      >
        <Card
          style={[
            styles.teamCard,
            isSelected && { borderColor: theme.primary, borderWidth: 2 },
          ]}
        >
          <TeamFlag url={item.flagImageUrl} size={48} />
          <Text style={[styles.teamName, { color: theme.text }]}>{item.name}</Text>
          {isSelected && (
            <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
              <Check size={16} color="#FFFFFF" />
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Logo size="medium" />
        <Text style={[styles.title, { color: theme.text }]}>{t.favoriteTeam.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t.favoriteTeam.subtitle}
        </Text>
      </View>

      <View style={[styles.warning, { backgroundColor: theme.warning + '20' }]}>
        <AlertTriangle size={20} color={theme.warning} />
        <Text style={[styles.warningText, { color: theme.warning }]}>
          {t.favoriteTeam.warning}
        </Text>
      </View>

      <FlatList
        data={teamsQuery.data || []}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title={t.favoriteTeam.confirm}
          onPress={handleConfirm}
          disabled={!selectedTeamId}
          loading={setFavoriteMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  list: {
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 6,
    maxWidth: '48%',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 12,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 24,
  },
});
