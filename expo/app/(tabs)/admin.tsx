import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Flag, Trophy, Calendar, Plus, Trash2, Check, X } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TeamFlag } from '@/components/TeamFlag';

type AdminTab = 'users' | 'teams' | 'tournaments' | 'matches';

export default function AdminScreen() {
  const { theme, t, selectedTournamentId } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'PLAYER'>('PLAYER');
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamFlag, setNewTeamFlag] = useState('');
  
  const [newTournamentName, setNewTournamentName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchTeam1, setNewMatchTeam1] = useState('');
  const [newMatchTeam2, setNewMatchTeam2] = useState('');
  const [newMatchStage, setNewMatchStage] = useState<'NORMAL' | 'SEMIFINAL' | 'FINAL'>('NORMAL');
  
  const [resultTeam1, setResultTeam1] = useState('');
  const [resultTeam2, setResultTeam2] = useState('');

  const utils = trpc.useUtils();
  
  const usersQuery = trpc.users.list.useQuery();
  const teamsQuery = trpc.teams.list.useQuery();
  const tournamentsQuery = trpc.tournaments.list.useQuery();
  const matchesQuery = trpc.matches.listByTournament.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );
  const tournamentDetailsQuery = trpc.tournaments.getById.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      resetForm();
      Alert.alert(t.common.success);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      utils.teams.list.invalidate();
      resetForm();
      Alert.alert(t.common.success);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => utils.teams.list.invalidate(),
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const createTournamentMutation = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      utils.tournaments.list.invalidate();
      resetForm();
      Alert.alert(t.common.success);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const createMatchMutation = trpc.matches.create.useMutation({
    onSuccess: () => {
      utils.matches.listByTournament.invalidate({ tournamentId: selectedTournamentId || '' });
      resetForm();
      Alert.alert(t.common.success);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const setResultMutation = trpc.matches.setResult.useMutation({
    onSuccess: () => {
      utils.matches.listByTournament.invalidate({ tournamentId: selectedTournamentId || '' });
      setShowResultModal(false);
      setSelectedMatchId(null);
      setResultTeam1('');
      setResultTeam2('');
      Alert.alert(t.common.success);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const resetForm = () => {
    setShowCreateModal(false);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('PLAYER');
    setNewTeamName('');
    setNewTeamFlag('');
    setNewTournamentName('');
    setSelectedTeamIds([]);
    setNewMatchDate('');
    setNewMatchTeam1('');
    setNewMatchTeam2('');
    setNewMatchStage('NORMAL');
  };

  const handleCreate = () => {
    switch (activeTab) {
      case 'users':
        createUserMutation.mutate({ username: newUsername, email: newEmail, password: newPassword, role: newRole });
        break;
      case 'teams':
        createTeamMutation.mutate({ name: newTeamName, flagImageUrl: newTeamFlag });
        break;
      case 'tournaments':
        createTournamentMutation.mutate({ name: newTournamentName, teamIds: selectedTeamIds });
        break;
      case 'matches':
        if (!selectedTournamentId) return;
        createMatchMutation.mutate({
          tournamentId: selectedTournamentId,
          startDatetime: new Date(newMatchDate).toISOString(),
          team1Id: newMatchTeam1,
          team2Id: newMatchTeam2,
          stage: newMatchStage,
        });
        break;
    }
  };

  const handleSetResult = () => {
    if (!selectedMatchId) return;
    const g1 = parseInt(resultTeam1, 10);
    const g2 = parseInt(resultTeam2, 10);
    if (isNaN(g1) || isNaN(g2) || g1 < 0 || g2 < 0) {
      Alert.alert(t.common.error, 'Invalid goals');
      return;
    }
    setResultMutation.mutate({ matchId: selectedMatchId, team1Goals: g1, team2Goals: g2 });
  };

  const canSetResult = (match: any) => {
    const startTime = new Date(match.startDatetime).getTime();
    return Date.now() >= startTime + 2 * 60 * 60 * 1000;
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const tabs: { key: AdminTab; icon: any; label: string }[] = [
    { key: 'users', icon: Users, label: t.nav.users },
    { key: 'teams', icon: Flag, label: t.nav.teams },
    { key: 'tournaments', icon: Trophy, label: t.nav.tournaments },
    { key: 'matches', icon: Calendar, label: t.nav.matches },
  ];

  const paletteTeams = tournamentDetailsQuery.data?.teams || [];

  const renderCreateForm = () => {
    switch (activeTab) {
      case 'users':
        return (
          <>
            <Input label={t.auth.username} value={newUsername} onChangeText={setNewUsername} />
            <Input label={t.admin.email} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" />
            <Input label={t.auth.password} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.admin.role}</Text>
            <View style={styles.roleRow}>
              {(['PLAYER', 'ADMIN'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, { borderColor: newRole === role ? theme.primary : theme.border, backgroundColor: newRole === role ? theme.primary + '20' : 'transparent' }]}
                  onPress={() => setNewRole(role)}
                >
                  <Text style={[styles.roleText, { color: newRole === role ? theme.primary : theme.text }]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 'teams':
        return (
          <>
            <Input label={t.admin.team1} value={newTeamName} onChangeText={setNewTeamName} placeholder="Italy" />
            <Input label={t.admin.flagUrl} value={newTeamFlag} onChangeText={setNewTeamFlag} placeholder="https://flagcdn.com/w80/it.png" />
          </>
        );
      case 'tournaments':
        return (
          <>
            <Input label={t.nav.tournaments} value={newTournamentName} onChangeText={setNewTournamentName} placeholder="Euro 2024" />
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.admin.selectTeams}</Text>
            <View style={styles.teamGrid}>
              {teamsQuery.data?.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamChip, { borderColor: selectedTeamIds.includes(team.id) ? theme.primary : theme.border, backgroundColor: selectedTeamIds.includes(team.id) ? theme.primary + '20' : 'transparent' }]}
                  onPress={() => toggleTeamSelection(team.id)}
                >
                  <TeamFlag url={team.flagImageUrl} size={24} />
                  <Text style={[styles.teamChipText, { color: theme.text }]}>{team.name}</Text>
                  {selectedTeamIds.includes(team.id) && <Check size={16} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 'matches':
        return (
          <>
            <Input label={t.admin.matchDate} value={newMatchDate} onChangeText={setNewMatchDate} placeholder="2024-06-15T18:00" />
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.admin.team1}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
              {paletteTeams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamOption, { borderColor: newMatchTeam1 === team.id ? theme.primary : theme.border }]}
                  onPress={() => setNewMatchTeam1(team.id)}
                >
                  <TeamFlag url={team.flagImageUrl} size={32} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.admin.team2}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
              {paletteTeams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamOption, { borderColor: newMatchTeam2 === team.id ? theme.primary : theme.border }]}
                  onPress={() => setNewMatchTeam2(team.id)}
                >
                  <TeamFlag url={team.flagImageUrl} size={32} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.admin.stage}</Text>
            <View style={styles.roleRow}>
              {(['NORMAL', 'SEMIFINAL', 'FINAL'] as const).map(stage => (
                <TouchableOpacity
                  key={stage}
                  style={[styles.roleOption, { borderColor: newMatchStage === stage ? theme.primary : theme.border, backgroundColor: newMatchStage === stage ? theme.primary + '20' : 'transparent' }]}
                  onPress={() => setNewMatchStage(stage)}
                >
                  <Text style={[styles.roleText, { color: newMatchStage === stage ? theme.primary : theme.text }]}>{t.matches.stage[stage]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Logo size="small" />
      </View>

      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.icon size={20} color={activeTab === tab.key ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? theme.primary : theme.textMuted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {activeTab === 'users' && t.admin.manageUsers}
            {activeTab === 'teams' && t.admin.manageTeams}
            {activeTab === 'tournaments' && t.admin.manageTournaments}
            {activeTab === 'matches' && t.admin.manageMatches}
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {activeTab === 'users' && usersQuery.data?.map(user => (
          <Card key={user.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.text }]}>{user.username}</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted }]}>{user.email}</Text>
            </View>
            <Badge label={user.role} variant={user.role === 'ADMIN' ? 'warning' : 'primary'} />
            {user.role !== 'ADMIN' && (
              <TouchableOpacity onPress={() => deleteUserMutation.mutate({ userId: user.id })}>
                <Trash2 size={20} color={theme.error} />
              </TouchableOpacity>
            )}
          </Card>
        ))}

        {activeTab === 'teams' && teamsQuery.data?.map(team => (
          <Card key={team.id} style={styles.itemCard}>
            <TeamFlag url={team.flagImageUrl} size={40} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.text }]}>{team.name}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteTeamMutation.mutate({ teamId: team.id })}>
              <Trash2 size={20} color={theme.error} />
            </TouchableOpacity>
          </Card>
        ))}

        {activeTab === 'tournaments' && tournamentsQuery.data?.map(tournament => (
          <Card key={tournament.id} style={styles.itemCard}>
            <Trophy size={24} color={theme.accent} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.text }]}>{tournament.name}</Text>
            </View>
          </Card>
        ))}

        {activeTab === 'matches' && matchesQuery.data?.map(match => {
          const canSet = canSetResult(match);
          const hasResult = match.resultTeam1Goals !== null;
          return (
            <Card key={match.id} style={styles.matchCard}>
              <View style={styles.matchTeams}>
                <View style={styles.matchTeam}>
                  <TeamFlag url={match.team1.flagImageUrl} size={32} />
                  <Text style={[styles.matchTeamName, { color: theme.text }]}>{match.team1.name}</Text>
                </View>
                <View style={styles.matchScore}>
                  {hasResult ? (
                    <Text style={[styles.scoreText, { color: theme.text }]}>
                      {match.resultTeam1Goals} - {match.resultTeam2Goals}
                    </Text>
                  ) : (
                    <Text style={[styles.vsText, { color: theme.textMuted }]}>vs</Text>
                  )}
                </View>
                <View style={styles.matchTeam}>
                  <TeamFlag url={match.team2.flagImageUrl} size={32} />
                  <Text style={[styles.matchTeamName, { color: theme.text }]}>{match.team2.name}</Text>
                </View>
              </View>
              <Text style={[styles.matchDate, { color: theme.textMuted }]}>
                {new Date(match.startDatetime).toLocaleString()}
              </Text>
              {!hasResult && (
                <Button
                  title={t.admin.setResult}
                  onPress={() => {
                    setSelectedMatchId(match.id);
                    setShowResultModal(true);
                  }}
                  disabled={!canSet}
                  size="small"
                  style={{ marginTop: 12 }}
                />
              )}
              {!canSet && !hasResult && (
                <Text style={[styles.cantSetText, { color: theme.textMuted }]}>{t.admin.resultCannotSet}</Text>
              )}
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalScroll, { backgroundColor: theme.surface }]} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {activeTab === 'users' && t.admin.createUser}
                {activeTab === 'teams' && t.admin.createTeam}
                {activeTab === 'tournaments' && t.admin.createTournament}
                {activeTab === 'matches' && t.admin.createMatch}
              </Text>
              <TouchableOpacity onPress={resetForm}><X size={24} color={theme.textSecondary} /></TouchableOpacity>
            </View>
            {renderCreateForm()}
            <Button title={t.common.create} onPress={handleCreate} loading={createUserMutation.isPending || createTeamMutation.isPending || createTournamentMutation.isPending || createMatchMutation.isPending} style={{ marginTop: 16 }} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.admin.setResult}</Text>
            <View style={styles.resultInputs}>
              <Input label={t.admin.team1 + ' ' + t.admin.goals} value={resultTeam1} onChangeText={setResultTeam1} keyboardType="number-pad" style={{ flex: 1 }} />
              <Input label={t.admin.team2 + ' ' + t.admin.goals} value={resultTeam2} onChangeText={setResultTeam2} keyboardType="number-pad" style={{ flex: 1 }} />
            </View>
            <View style={styles.modalActions}>
              <Button title={t.common.cancel} onPress={() => setShowResultModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button title={t.common.save} onPress={handleSetResult} loading={setResultMutation.isPending} style={{ flex: 1 }} />
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
  tabBar: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabText: { fontSize: 11, fontWeight: '500' as const },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' as const },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600' as const },
  itemSub: { fontSize: 13, marginTop: 2 },
  matchCard: { marginBottom: 12 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { alignItems: 'center', flex: 1, gap: 6 },
  matchTeamName: { fontSize: 12, textAlign: 'center' },
  matchScore: { paddingHorizontal: 16 },
  scoreText: { fontSize: 20, fontWeight: '700' as const },
  vsText: { fontSize: 16 },
  matchDate: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  cantSetText: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalScroll: { borderRadius: 20, maxHeight: '80%' },
  modalScrollContent: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const },
  label: { fontSize: 14, fontWeight: '500' as const, marginBottom: 8, marginTop: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleOption: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  roleText: { fontSize: 14, fontWeight: '600' as const },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  teamChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 8 },
  teamChipText: { fontSize: 13 },
  teamScroll: { marginBottom: 8 },
  teamOption: { padding: 8, borderRadius: 10, borderWidth: 2, marginRight: 10 },
  resultInputs: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
