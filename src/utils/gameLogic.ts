/**
 * Game Logic Utilities for Blind Date Style-Off
 * Handles scoring, matching, and game mechanics
 */

export interface StyleChoice {
  category: 'outfit' | 'hairstyle' | 'accessories' | 'makeup' | 'background';
  item: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  culturalBonus?: string; // For cultural accuracy bonuses
}

export interface GameSettings {
  roundDuration: number; // seconds
  votingDuration: number; // seconds
  maxParticipants: number;
  gameMode: 'classic' | 'speed' | 'cultural' | 'tournament';
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface PlayerStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  winRate: number;
  favoriteStyle: string;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Style point values and calculations
export const STYLE_POINTS = {
  // Base outfit points
  outfit: {
    traditional: { base: 15, cultural_bonus: 5 },
    modern: { base: 12, trend_bonus: 3 },
    fusion: { base: 18, creativity_bonus: 7 },
    casual: { base: 8, comfort_bonus: 2 }
  },
  
  // Accessory multipliers
  accessories: {
    matching_set: 1.2,
    cultural_authentic: 1.3,
    creative_mix: 1.1,
    minimalist: 1.0
  },

  // Color harmony bonuses
  colors: {
    complementary: 5,
    analogous: 3,
    triadic: 4,
    monochromatic: 2
  },

  // Special bonuses
  bonuses: {
    cultural_accuracy: 10,
    trend_awareness: 8,
    creativity: 12,
    elegance: 6,
    uniqueness: 15
  }
};

// Game mode configurations
export const GAME_MODES: Record<string, GameSettings> = {
  classic: {
    roundDuration: 90,
    votingDuration: 30,
    maxParticipants: 4,
    gameMode: 'classic',
    difficultyLevel: 'medium'
  },
  speed: {
    roundDuration: 45,
    votingDuration: 15,
    maxParticipants: 6,
    gameMode: 'speed', 
    difficultyLevel: 'hard'
  },
  cultural: {
    roundDuration: 120,
    votingDuration: 45,
    maxParticipants: 4,
    gameMode: 'cultural',
    difficultyLevel: 'expert'
  },
  tournament: {
    roundDuration: 60,
    votingDuration: 30,
    maxParticipants: 8,
    gameMode: 'tournament',
    difficultyLevel: 'hard'
  }
};

/**
 * Calculate style points based on player choices
 */
export const calculateStylePoints = (
  choices: StyleChoice[], 
  theme?: string,
  culturalContext?: string
): number => {
  let totalPoints = 0;
  let bonusMultiplier = 1;

  // Base points from individual choices
  choices.forEach(choice => {
    totalPoints += choice.points;
    
    // Rarity bonuses
    switch (choice.rarity) {
      case 'rare': totalPoints += 2; break;
      case 'epic': totalPoints += 5; break;
      case 'legendary': totalPoints += 10; break;
    }
  });

  // Cultural accuracy bonus
  if (culturalContext && choices.some(c => c.culturalBonus === culturalContext)) {
    totalPoints += STYLE_POINTS.bonuses.cultural_accuracy;
    bonusMultiplier *= 1.15;
  }

  // Outfit coordination bonus
  const outfitChoices = choices.filter(c => c.category === 'outfit');
  const accessoryChoices = choices.filter(c => c.category === 'accessories');
  
  if (outfitChoices.length > 0 && accessoryChoices.length >= 2) {
    totalPoints += STYLE_POINTS.bonuses.elegance;
  }

  // Creativity bonus for unique combinations
  const uniqueCombinations = new Set(choices.map(c => c.item)).size;
  if (uniqueCombinations === choices.length && choices.length >= 4) {
    totalPoints += STYLE_POINTS.bonuses.creativity;
    bonusMultiplier *= 1.1;
  }

  // Theme matching bonus
  if (theme && choices.some(c => c.item.toLowerCase().includes(theme.toLowerCase()))) {
    totalPoints += STYLE_POINTS.bonuses.trend_awareness;
  }

  return Math.round(totalPoints * bonusMultiplier);
};

/**
 * Generate random style challenges for rounds
 */
export const generateStyleChallenge = (
  round: number, 
  difficulty: string,
  culturalContext?: string
) => {
  const challenges = {
    easy: [
      'Create a simple traditional look',
      'Design a modern casual outfit',
      'Choose a bright and cheerful style'
    ],
    medium: [
      'Blend traditional and modern elements',
      'Create an elegant evening look',
      'Design a culturally authentic outfit',
      'Mix patterns and textures creatively'
    ],
    hard: [
      'Create a fusion of three different cultural styles',
      'Design an avant-garde wedding look',
      'Incorporate five different textures harmoniously',
      'Create a look that tells a story'
    ],
    expert: [
      'Design a look that represents a specific emotion',
      'Create a style that breaks conventional rules beautifully',
      'Blend historical and futuristic elements',
      'Design using only complementary colors'
    ]
  };

  const availableChallenges = challenges[difficulty as keyof typeof challenges] || challenges.medium;
  const baseChallenge = availableChallenges[round % availableChallenges.length];

  // Add cultural context if specified
  if (culturalContext) {
    return `${baseChallenge} with ${culturalContext} influences`;
  }

  return baseChallenge;
};

/**
 * Calculate match compatibility for players
 */
export const calculatePlayerCompatibility = (
  player1Stats: PlayerStats,
  player2Stats: PlayerStats
): number => {
  // Skill level compatibility (closer skill = higher compatibility)
  const skillDiff = Math.abs(player1Stats.averageScore - player2Stats.averageScore);
  const maxSkillDiff = 100; // Maximum expected score difference
  const skillCompatibility = 1 - (skillDiff / maxSkillDiff);

  // Play style compatibility (similar favorite styles = higher compatibility)
  const styleCompatibility = player1Stats.favoriteStyle === player2Stats.favoriteStyle ? 1 : 0.7;

  // Experience compatibility (similar games played = better match)
  const expDiff = Math.abs(player1Stats.gamesPlayed - player2Stats.gamesPlayed);
  const maxExpDiff = 50; // Maximum expected games difference
  const expCompatibility = 1 - (expDiff / maxExpDiff);

  // Weighted average
  return (
    skillCompatibility * 0.4 +
    styleCompatibility * 0.3 +
    expCompatibility * 0.3
  );
};

/**
 * Generate achievements based on game performance
 */
export const checkAchievements = (
  currentStats: PlayerStats,
  gameResult: any
): Achievement[] => {
  const newAchievements: Achievement[] = [];

  // First Win
  if (currentStats.gamesWon === 1 && gameResult.won) {
    newAchievements.push({
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first style-off battle',
      icon: '🏆',
      unlockedAt: new Date().toISOString(),
      rarity: 'common'
    });
  }

  // Perfect Score
  if (gameResult.score === 100) {
    newAchievements.push({
      id: 'perfect_score',
      name: 'Flawless Style',
      description: 'Achieve a perfect score of 100',
      icon: '✨',
      unlockedAt: new Date().toISOString(),
      rarity: 'epic'
    });
  }

  // Cultural Master
  if (gameResult.culturalBonus >= 20) {
    newAchievements.push({
      id: 'cultural_master',
      name: 'Cultural Connoisseur',
      description: 'Master traditional styling with cultural accuracy',
      icon: '🏛️',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare'
    });
  }

  // Speed Demon
  if (gameResult.completionTime < 30) {
    newAchievements.push({
      id: 'speed_demon',
      name: 'Lightning Fast',
      description: 'Complete styling in under 30 seconds',
      icon: '⚡',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare'
    });
  }

  // Win Streak
  if (currentStats.winRate >= 0.8 && currentStats.gamesPlayed >= 10) {
    newAchievements.push({
      id: 'win_streak',
      name: 'Style Domination',
      description: 'Maintain 80%+ win rate over 10+ games',
      icon: '🔥',
      unlockedAt: new Date().toISOString(),
      rarity: 'legendary'
    });
  }

  return newAchievements;
};

/**
 * Smart matchmaking algorithm
 */
export const findBestMatch = (
  currentPlayer: PlayerStats,
  availablePlayers: PlayerStats[],
  maxWaitTime: number = 30000 // 30 seconds
): PlayerStats[] => {
  // Sort by compatibility score
  const compatibilityScores = availablePlayers.map(player => ({
    player,
    compatibility: calculatePlayerCompatibility(currentPlayer, player)
  }));

  compatibilityScores.sort((a, b) => b.compatibility - a.compatibility);

  // Implement time-based matching expansion
  // As wait time increases, accept lower compatibility matches
  const timeElapsed = maxWaitTime; // This would be passed from the calling code
  const compatibilityThreshold = Math.max(0.3, 0.8 - (timeElapsed / maxWaitTime) * 0.5);

  return compatibilityScores
    .filter(score => score.compatibility >= compatibilityThreshold)
    .slice(0, 3) // Return top 3 matches
    .map(score => score.player);
};

/**
 * Real-time scoring with animations
 */
export const calculateLiveScore = (
  choices: StyleChoice[],
  timeRemaining: number,
  bonusMultipliers: Record<string, number> = {}
): { score: number; breakdown: any; animations: string[] } => {
  const baseScore = calculateStylePoints(choices);
  
  // Time bonus (faster completion = bonus points)
  const timeBonus = timeRemaining > 0 ? Math.floor(timeRemaining / 10) : 0;
  
  // Apply bonus multipliers
  let finalScore = baseScore + timeBonus;
  Object.values(bonusMultipliers).forEach(multiplier => {
    finalScore *= multiplier;
  });

  // Generate animation triggers
  const animations = [];
  if (timeBonus > 0) animations.push('time_bonus');
  if (choices.some(c => c.rarity === 'legendary')) animations.push('legendary_sparkle');
  if (finalScore > baseScore * 1.5) animations.push('score_boost');

  return {
    score: Math.round(finalScore),
    breakdown: {
      base: baseScore,
      timeBonus,
      multipliers: bonusMultipliers,
      total: Math.round(finalScore)
    },
    animations
  };
};

/**
 * Game state persistence utilities
 */
export const saveGameState = (gameId: string, state: any) => {
  try {
    localStorage.setItem(`game_${gameId}`, JSON.stringify({
      ...state,
      lastSaved: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save game state:', error);
  }
};

export const loadGameState = (gameId: string) => {
  try {
    const saved = localStorage.getItem(`game_${gameId}`);
    if (saved) {
      const state = JSON.parse(saved);
      // Check if state is not too old (1 hour max)
      if (Date.now() - state.lastSaved < 3600000) {
        return state;
      }
    }
  } catch (error) {
    console.warn('Failed to load game state:', error);
  }
  return null;
};

export const clearGameState = (gameId: string) => {
  try {
    localStorage.removeItem(`game_${gameId}`);
  } catch (error) {
    console.warn('Failed to clear game state:', error);
  }
};