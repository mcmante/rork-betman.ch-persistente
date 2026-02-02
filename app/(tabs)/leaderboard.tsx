import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Medal } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/Card';

export default function LeaderboardScreen() {
  const { theme, t, selectedTournamentId, user } = useApp();

  const leaderboardQuery = trpc.leaderboard.getByTournament.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );
  const tournamentsQuery = trpc.tournaments.list.useQuery();

  const selectedTournament = tournamentsQuery.data?.find(t => t.id === selectedTournamentId);
  const entries = leaderboardQuery.data || [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} color={theme.gold} fill={theme.gold} />;
    if (rank === 2) return <Medal size={20} color={theme.silver} />;
    if (rank === 3) return <Medal size={20} color={theme.bronze} />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return theme.gold;
    if (rank === 2) return theme.silver;
    if (rank === 3) return theme.bronze;
    return theme.textSecondary;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCurrentUser = item.userId === user?.id;
    
    return (
      <Card
        style={[
          styles.entryCard,
          isCurrentUser && { borderColor: theme.primary, borderWidth: 2 },
        ]}
      >
        <View style={[styles.rankContainer, { backgroundColor: getRankColor(item.rank) + '20' }]}>
          {getRankIcon(item.rank) || (
            <Text style={[styles.rankNumber, { color: getRankColor(item.rank) }]}>
              {item.rank}
            </Text>
          )}
        </View>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: theme.text }]}>
            {item.username}
            {isCurrentUser && (
              <Text style={[styles.youLabel, { color: theme.primary }]}> {t.leaderboard.you}</Text>
            )}
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={[styles.points, { color: theme.primary }]}>{item.totalPoints}</Text>
          <Text style={[styles.pointsLabel, { color: theme.textMuted }]}>{t.common.pts}</Text>
        </View>
      </Card>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={[styles.tournamentTitle, { color: theme.text }]}>
        {selectedTournament?.name || t.tournament.select}
      </Text>
      <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, styles.rankCol, { color: theme.textMuted }]}>
          {t.leaderboard.rank}
        </Text>
        <Text style={[styles.headerText, styles.playerCol, { color: theme.textMuted }]}>
          {t.leaderboard.player}
        </Text>
        <Text style={[styles.headerText, styles.pointsCol, { color: theme.textMuted }]}>
          {t.leaderboard.points}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Logo size="small" />
      </View>

      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !leaderboardQuery.isLoading ? (
            <View style={styles.emptyContainer}>
              <Trophy size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {t.leaderboard.noPlayers}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={leaderboardQuery.isRefetching}
            onRefresh={() => leaderboardQuery.refetch()}
            tintColor={theme.primary}
          />
        }
      />
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
  headerSection: {
    marginBottom: 8,
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  rankCol: {
    width: 50,
  },
  playerCol: {
    flex: 1,
  },
  pointsCol: {
    width: 60,
    textAlign: 'right',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 12,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  youLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  pointsLabel: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
