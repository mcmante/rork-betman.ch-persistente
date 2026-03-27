import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { ChevronDown, Zap, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { MatchCard } from '@/components/MatchCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type BonusType = 'DOUBLE_POINTS' | 'GOAL_DIFF_MULTIPLIER' | 'PLUS_1H';

export default function MatchesScreen() {
  const { theme, t, selectedTournamentId, setSelectedTournament, user } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const isConfig = user?.role === 'CONFIG';

  const [showTournamentPicker, setShowTournamentPicker] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const tournamentsQuery = trpc.tournaments.list.useQuery();
  const matchesQuery = trpc.matches.listByTournament.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );
  const inventoryQuery = trpc.bonus.getInventory.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );

  const initTournamentMutation = trpc.tournaments.initializeForUser.useMutation();
  const savePredictionMutation = trpc.predictions.upsert.useMutation({
    onSuccess: () => {
      utils.matches.listByTournament.invalidate({ tournamentId: selectedTournamentId || '' });
    },
  });
  const useBonusMutation = trpc.bonus.useBonus.useMutation({
    onSuccess: () => {
      utils.matches.listByTournament.invalidate({ tournamentId: selectedTournamentId || '' });
      utils.bonus.getInventory.invalidate({ tournamentId: selectedTournamentId || '' });
      setShowBonusModal(false);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });
  const removeBonusMutation = trpc.bonus.removeBonus.useMutation({
    onSuccess: () => {
      utils.matches.listByTournament.invalidate({ tournamentId: selectedTournamentId || '' });
      utils.bonus.getInventory.invalidate({ tournamentId: selectedTournamentId || '' });
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const selectedTournament = tournamentsQuery.data?.find(t => t.id === selectedTournamentId);

  React.useEffect(() => {
    if (tournamentsQuery.data?.length && !selectedTournamentId) {
      const first = tournamentsQuery.data[0];
      setSelectedTournament(first.id);
      initTournamentMutation.mutate({ tournamentId: first.id });
    }
  }, [tournamentsQuery.data, selectedTournamentId, setSelectedTournament, initTournamentMutation]);

  const handleSelectTournament = (id: string) => {
    setSelectedTournament(id);
    initTournamentMutation.mutate({ tournamentId: id });
    setShowTournamentPicker(false);
  };

  const handleSavePrediction = useCallback(async (matchId: string, team1Goals: number, team2Goals: number) => {
    setSavingMatchId(matchId);
    try {
      await savePredictionMutation.mutateAsync({ matchId, team1Goals, team2Goals });
    } finally {
      setSavingMatchId(null);
    }
  }, [savePredictionMutation]);

  const handleSelectBonus = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    setShowBonusModal(true);
  }, []);

  const handleRemoveBonus = useCallback((matchId: string) => {
    removeBonusMutation.mutate({ matchId });
  }, [removeBonusMutation]);

  const handleApplyBonus = useCallback((bonusType: BonusType) => {
    if (!selectedMatchId) return;
    useBonusMutation.mutate({ matchId: selectedMatchId, bonusType });
  }, [selectedMatchId, useBonusMutation]);

  const isPredictionOpen = useCallback((match: any) => {
    const startTime = new Date(match.startDatetime).getTime();
    const now = Date.now();
    const hasPlus1H = match.bonusUsage?.bonusType === 'PLUS_1H';
    
    if (hasPlus1H) {
      return now < startTime + 60 * 60 * 1000;
    }
    return now < startTime;
  }, []);

  const { upcomingMatches, completedMatches } = useMemo(() => {
    const matches = matchesQuery.data || [];
    const upcoming = matches.filter(m => m.resultTeam1Goals === null);
    const completed = matches.filter(m => m.resultTeam1Goals !== null);
    return { upcomingMatches: upcoming, completedMatches: completed };
  }, [matchesQuery.data]);

  const inventory = inventoryQuery.data || [];

  if (isConfig) {
    return <Redirect href="/dbconfig" />;
  }

  const getBonusQuantity = (type: BonusType) => {
    return inventory.find(i => i.bonusType === type)?.quantity || 0;
  };

  const renderMatch = useCallback(({ item }: { item: any }) => (
    <MatchCard
      match={item}
      onSavePrediction={handleSavePrediction}
      onSelectBonus={handleSelectBonus}
      onRemoveBonus={handleRemoveBonus}
      isPredictionOpen={isPredictionOpen(item)}
      isLoading={savingMatchId === item.id}
      readOnly={isAdmin}
    />
  ), [handleSavePrediction, handleSelectBonus, handleRemoveBonus, isPredictionOpen, savingMatchId, isAdmin]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <TouchableOpacity
        style={[styles.tournamentSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setShowTournamentPicker(true)}
      >
        <Text style={[styles.tournamentName, { color: theme.text }]}>
          {selectedTournament?.name || t.tournament.select}
        </Text>
        <ChevronDown size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {upcomingMatches.length > 0 && (
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.matches.upcoming}</Text>
      )}
    </View>
  );

  const ListFooter = () => (
    completedMatches.length > 0 ? (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          {t.matches.completed}
        </Text>
        {completedMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            onSavePrediction={handleSavePrediction}
            onSelectBonus={handleSelectBonus}
            onRemoveBonus={handleRemoveBonus}
            isPredictionOpen={false}
            readOnly={isAdmin}
          />
        ))}
      </View>
    ) : null
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Logo size="small" />
      </View>

      <FlatList
        data={upcomingMatches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          !matchesQuery.isLoading ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {t.common.noData}
            </Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={matchesQuery.isRefetching}
            onRefresh={() => matchesQuery.refetch()}
            tintColor={theme.primary}
          />
        }
      />

      <Modal visible={showTournamentPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.tournament.select}</Text>
            {tournamentsQuery.data?.map(tournament => (
              <TouchableOpacity
                key={tournament.id}
                style={[
                  styles.tournamentOption,
                  { borderBottomColor: theme.border },
                  tournament.id === selectedTournamentId && { backgroundColor: theme.primaryLight + '20' },
                ]}
                onPress={() => handleSelectTournament(tournament.id)}
              >
                <Text style={[styles.tournamentOptionText, { color: theme.text }]}>
                  {tournament.name}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title={t.common.cancel}
              onPress={() => setShowTournamentPicker(false)}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showBonusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bonusModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.bonusModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t.matches.selectBonus}</Text>
              <TouchableOpacity onPress={() => setShowBonusModal(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {(['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H'] as BonusType[]).map(type => {
              const qty = getBonusQuantity(type);
              return (
                <Card
                  key={type}
                  style={[styles.bonusOption, qty === 0 && { opacity: 0.5 }]}
                  onPress={qty > 0 ? () => handleApplyBonus(type) : undefined}
                >
                  <View style={[styles.bonusIcon, { backgroundColor: theme.accent + '20' }]}>
                    <Zap size={24} color={theme.accent} />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={[styles.bonusName, { color: theme.text }]}>
                      {t.bonus[type]}
                    </Text>
                    <Text style={[styles.bonusDesc, { color: theme.textSecondary }]}>
                      {type === 'DOUBLE_POINTS' && t.bonus.doubleDescription}
                      {type === 'GOAL_DIFF_MULTIPLIER' && t.bonus.goalDiffDescription}
                      {type === 'PLUS_1H' && t.bonus.plus1hDescription}
                    </Text>
                  </View>
                  <View style={[styles.bonusQty, { backgroundColor: theme.primaryLight + '20' }]}>
                    <Text style={[styles.bonusQtyText, { color: theme.primary }]}>{qty}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 8,
  },
  tournamentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  tournamentOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tournamentOptionText: {
    fontSize: 16,
  },
  bonusModalContent: {
    borderRadius: 20,
    padding: 20,
    marginTop: 'auto',
    marginBottom: 40,
  },
  bonusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bonusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bonusName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bonusDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  bonusQty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusQtyText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
