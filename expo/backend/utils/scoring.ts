import { Match, Prediction, BonusUsage, BonusType } from '../types';

export const calculateBasePoints = (
  prediction: Prediction,
  match: Match
): number => {
  if (match.resultTeam1Goals === null || match.resultTeam2Goals === null) {
    return 0;
  }

  const predDiff = prediction.predTeam1Goals - prediction.predTeam2Goals;
  const realDiff = match.resultTeam1Goals - match.resultTeam2Goals;

  if (
    prediction.predTeam1Goals === match.resultTeam1Goals &&
    prediction.predTeam2Goals === match.resultTeam2Goals
  ) {
    return 5;
  }

  if (predDiff === realDiff) {
    return 2;
  }

  const predOutcome = predDiff > 0 ? 'win1' : predDiff < 0 ? 'win2' : 'draw';
  const realOutcome = realDiff > 0 ? 'win1' : realDiff < 0 ? 'win2' : 'draw';

  if (predOutcome === realOutcome) {
    return 1;
  }

  return 0;
};

export const calculateBonusMultiplier = (
  bonusUsage: BonusUsage | undefined,
  match: Match
): number => {
  if (!bonusUsage) return 1;

  switch (bonusUsage.bonusType) {
    case 'DOUBLE_POINTS':
      return 2;
    case 'GOAL_DIFF_MULTIPLIER':
      if (match.resultTeam1Goals === null || match.resultTeam2Goals === null) {
        return 1;
      }
      return Math.max(1, Math.abs(match.resultTeam1Goals - match.resultTeam2Goals));
    case 'PLUS_1H':
      return 1;
    default:
      return 1;
  }
};

export const calculateFavoriteTeamMultiplier = (
  favoriteTeamId: string | null,
  match: Match
): number => {
  if (!favoriteTeamId) return 1;
  if (match.team1Id === favoriteTeamId || match.team2Id === favoriteTeamId) {
    return 2;
  }
  return 1;
};

export const calculateStageMultiplier = (match: Match): number => {
  if (match.stage === 'SEMIFINAL' || match.stage === 'FINAL') {
    return 2;
  }
  return 1;
};

export const calculateFinalPoints = (
  basePoints: number,
  bonusMultiplier: number,
  favoriteMultiplier: number,
  stageMultiplier: number
): number => {
  return basePoints * bonusMultiplier * favoriteMultiplier * stageMultiplier;
};

export const canSetResult = (match: Match): boolean => {
  const startTime = new Date(match.startDatetime).getTime();
  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  return now >= startTime + twoHoursMs;
};

export const canMakePrediction = (
  match: Match,
  hasPlus1HBonus: boolean
): boolean => {
  const startTime = new Date(match.startDatetime).getTime();
  const now = Date.now();
  
  if (hasPlus1HBonus) {
    const oneHourMs = 60 * 60 * 1000;
    return now < startTime + oneHourMs;
  }
  
  return now < startTime;
};

export const canRemoveBonus = (
  bonusType: BonusType,
  match: Match
): boolean => {
  const startTime = new Date(match.startDatetime).getTime();
  const now = Date.now();
  
  if (bonusType === 'PLUS_1H') {
    const oneHourMs = 60 * 60 * 1000;
    return now < startTime + oneHourMs;
  }
  
  return now < startTime;
};
