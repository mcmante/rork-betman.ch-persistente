import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Heart, Zap } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TeamFlag } from '@/components/TeamFlag';
import { Button } from '@/components/ui/Button';

interface Team {
  id: string;
  name: string;
  flagImageUrl: string;
}

interface Prediction {
  predTeam1Goals: number;
  predTeam2Goals: number;
}

interface BonusUsage {
  bonusType: 'DOUBLE_POINTS' | 'GOAL_DIFF_MULTIPLIER' | 'PLUS_1H';
}

interface MatchCardProps {
  match: {
    id: string;
    startDatetime: string;
    team1: Team;
    team2: Team;
    stage: 'NORMAL' | 'SEMIFINAL' | 'FINAL';
    resultTeam1Goals: number | null;
    resultTeam2Goals: number | null;
    prediction?: Prediction;
    bonusUsage?: BonusUsage;
    isFavoriteTeamMatch: boolean;
  };
  onSavePrediction: (matchId: string, team1Goals: number, team2Goals: number) => void;
  onSelectBonus: (matchId: string) => void;
  onRemoveBonus: (matchId: string) => void;
  isPredictionOpen: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onSavePrediction,
  onSelectBonus,
  onRemoveBonus,
  isPredictionOpen,
  isLoading = false,
  readOnly = false,
}) => {
  const { theme, t } = useApp();
  const [team1Goals, setTeam1Goals] = useState(
    match.prediction?.predTeam1Goals?.toString() ?? ''
  );
  const [team2Goals, setTeam2Goals] = useState(
    match.prediction?.predTeam2Goals?.toString() ?? ''
  );

  const matchDate = new Date(match.startDatetime);
  const isCompleted = match.resultTeam1Goals !== null;
  const isPast = matchDate.getTime() < Date.now();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageBadge = () => {
    if (match.stage === 'FINAL') return { label: t.matches.stage.FINAL, variant: 'gold' as const };
    if (match.stage === 'SEMIFINAL') return { label: t.matches.stage.SEMIFINAL, variant: 'silver' as const };
    return null;
  };

  const getBonusLabel = (type: string) => {
    switch (type) {
      case 'DOUBLE_POINTS': return t.bonus.DOUBLE_POINTS;
      case 'GOAL_DIFF_MULTIPLIER': return t.bonus.GOAL_DIFF_MULTIPLIER;
      case 'PLUS_1H': return t.bonus.PLUS_1H;
      default: return type;
    }
  };

  const handleSave = () => {
    const g1 = parseInt(team1Goals, 10);
    const g2 = parseInt(team2Goals, 10);
    if (!isNaN(g1) && !isNaN(g2) && g1 >= 0 && g2 >= 0) {
      onSavePrediction(match.id, g1, g2);
    }
  };

  const stageBadge = getStageBadge();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatDate(matchDate)}
        </Text>
        <View style={styles.badges}>
          {stageBadge && <Badge label={stageBadge.label} variant={stageBadge.variant} />}
          {match.isFavoriteTeamMatch && (
            <View style={[styles.favoriteIcon, { backgroundColor: theme.error + '20' }]}>
              <Heart size={14} color={theme.error} fill={theme.error} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.teamSection}>
          <TeamFlag url={match.team1.flagImageUrl} size={48} />
          <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
            {match.team1.name}
          </Text>
        </View>

        <View style={styles.scoreSection}>
          {isCompleted ? (
            <View style={styles.result}>
              <Text style={[styles.resultScore, { color: theme.text }]}>
                {match.resultTeam1Goals} - {match.resultTeam2Goals}
              </Text>
              <Text style={[styles.resultLabel, { color: theme.textMuted }]}>
                {t.matches.result}
              </Text>
            </View>
          ) : (
            <Text style={[styles.vs, { color: theme.textMuted }]}>{t.matches.vs}</Text>
          )}
        </View>

        <View style={styles.teamSection}>
          <TeamFlag url={match.team2.flagImageUrl} size={48} />
          <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
            {match.team2.name}
          </Text>
        </View>
      </View>

      {match.bonusUsage && !readOnly && (
        <View style={[styles.bonusApplied, { backgroundColor: theme.accent + '20' }]}>
          <Zap size={14} color={theme.accent} />
          <Text style={[styles.bonusText, { color: theme.accent }]}>
            {getBonusLabel(match.bonusUsage.bonusType)}
          </Text>
          {isPredictionOpen && (
            <TouchableOpacity onPress={() => onRemoveBonus(match.id)}>
              <Text style={[styles.removeBonus, { color: theme.error }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!readOnly && (
        <View style={[styles.predictionSection, { borderTopColor: theme.border }]}>
          <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>
            {t.matches.prediction}
          </Text>
          
          {isPredictionOpen ? (
            <View style={styles.predictionInputs}>
              <TextInput
                style={[styles.goalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={team1Goals}
                onChangeText={setTeam1Goals}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
              />
              <Text style={[styles.predictionDash, { color: theme.textMuted }]}>-</Text>
              <TextInput
                style={[styles.goalInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={team2Goals}
                onChangeText={setTeam2Goals}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          ) : (
            <View style={styles.predictionDisplay}>
              {match.prediction ? (
                <Text style={[styles.predictionScore, { color: theme.primary }]}>
                  {match.prediction.predTeam1Goals} - {match.prediction.predTeam2Goals}
                </Text>
              ) : (
                <Text style={[styles.noPrediction, { color: theme.textMuted }]}>
                  {isPast ? t.matches.noPrediction : t.matches.predictionLocked}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {isPredictionOpen && !readOnly && (
        <View style={styles.actions}>
          {!match.bonusUsage && (
            <TouchableOpacity
              style={[styles.bonusButton, { borderColor: theme.accent }]}
              onPress={() => onSelectBonus(match.id)}
            >
              <Zap size={16} color={theme.accent} />
              <Text style={[styles.bonusButtonText, { color: theme.accent }]}>
                {t.matches.selectBonus}
              </Text>
            </TouchableOpacity>
          )}
          <Button
            title={t.matches.savePrediction}
            onPress={handleSave}
            loading={isLoading}
            disabled={team1Goals === '' || team2Goals === ''}
            size="small"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  scoreSection: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  vs: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  result: {
    alignItems: 'center',
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  resultLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  bonusApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  removeBonus: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  predictionSection: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  predictionLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  predictionInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  goalInput: {
    width: 56,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  predictionDash: {
    fontSize: 20,
    fontWeight: '500' as const,
  },
  predictionDisplay: {
    alignItems: 'center',
  },
  predictionScore: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  noPrediction: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  bonusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  bonusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
