/**
 * Comprehensive Type Definitions for Game System
 */

// Core Game Types
export type GameStatus = 'waiting' | 'active' | 'completed' | 'timeout' | 'cancelled';
export type GameMode = 'classic' | 'speed' | 'cultural' | 'tournament' | 'practice';
export type PlayerRole = 'host' | 'participant' | 'spectator';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'unstable';

// Game Session Interface
export interface GameSession {
  id: string;
  status: GameStatus;
  mode: GameMode;
  title: string;
  description?: string;
  hostId: string;
  participants: GameParticipant[];
  settings: GameSettings;
  currentRound: number;
  totalRounds: number;
  startedAt?: string;
  completedAt?: string;
  lastActivity: string;
  metadata: GameMetadata;
}

// Player/Participant Interface
export interface GameParticipant {
  id: string;
  userId: string;
  sessionId: string;
  role: PlayerRole;
  displayName: string;
  avatarName: string;
  avatarConfig: AvatarConfiguration;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  joinedAt: string;
  lastSeen: string;
  currentScore: number;
  totalScore: number;
  roundScores: number[];
  achievements: Achievement[];
  stats: PlayerSessionStats;
}

// Avatar Configuration
export interface AvatarConfiguration {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  style: StyleTheme;
  outfit: OutfitConfig;
  accessories: AccessoryConfig[];
  hairstyle: HairstyleConfig;
  makeup?: MakeupConfig;
  pose: PoseConfig;
  background: BackgroundConfig;
  effects: VisualEffect[];
}

// Style and Fashion Types
export type StyleTheme = 'traditional' | 'modern' | 'cultural' | 'fusion' | 'vintage' | 'bohemian' | 'minimalist';
export type CulturalStyle = 'marathi' | 'punjabi' | 'tamil' | 'bengali' | 'gujarati' | 'south_indian' | 'north_indian';
export type ColorPalette = 'warm' | 'cool' | 'neutral' | 'bold' | 'pastel' | 'monochrome' | 'rainbow';

export interface OutfitConfig {
  type: 'lehenga' | 'saree' | 'gown' | 'sherwani' | 'suit' | 'kurta' | 'dress' | 'fusion';
  primaryColor: string;
  secondaryColor?: string;
  pattern: 'solid' | 'floral' | 'geometric' | 'embroidered' | 'printed' | 'textured';
  fabric: 'silk' | 'cotton' | 'velvet' | 'chiffon' | 'brocade' | 'linen' | 'synthetic';
  embellishments: Embellishment[];
  culturalStyle?: CulturalStyle;
  occasions: string[];
  rarity: ItemRarity;
  stylePoints: number;
}

export interface AccessoryConfig {
  type: 'jewelry' | 'footwear' | 'bags' | 'headwear' | 'belts' | 'scarves';
  item: string;
  material: 'gold' | 'silver' | 'diamond' | 'pearl' | 'kundan' | 'polki' | 'beads' | 'fabric';
  placement: string;
  culturalSignificance?: string;
  rarity: ItemRarity;
  bonus: AccessoryBonus;
}

export interface HairstyleConfig {
  type: 'updo' | 'braid' | 'loose' | 'bun' | 'ponytail' | 'traditional' | 'modern';
  decoration: string[];
  culturalStyle?: string;
  complexity: 'simple' | 'medium' | 'elaborate';
  occasion: string[];
}

export interface MakeupConfig {
  style: 'natural' | 'dramatic' | 'traditional' | 'modern' | 'bold' | 'subtle';
  eyeshadow: ColorConfig;
  lipstick: ColorConfig;
  blush: ColorConfig;
  highlights: ColorConfig[];
  culturalElements: string[];
}

export interface PoseConfig {
  name: string;
  category: 'standing' | 'sitting' | 'dancing' | 'traditional' | 'candid' | 'artistic';
  mood: EmotionType;
  difficulty: 'easy' | 'medium' | 'hard';
  culturalContext?: string;
}

export interface BackgroundConfig {
  type: 'location' | 'studio' | 'nature' | 'architectural' | 'abstract';
  setting: string;
  ambiance: 'romantic' | 'dramatic' | 'peaceful' | 'festive' | 'elegant' | 'fun';
  lighting: 'natural' | 'studio' | 'golden_hour' | 'blue_hour' | 'dramatic' | 'soft';
  culturalRelevance?: number;
}

// Game Mechanics Types
export interface GameSettings {
  maxParticipants: number;
  roundDuration: number; // seconds
  votingDuration: number; // seconds
  intermissionDuration: number; // seconds
  totalRounds: number;
  gameMode: GameMode;
  difficultyLevel: DifficultyLevel;
  enableCultureBonus: boolean;
  enableTimeBonus: boolean;
  enableVoting: boolean;
  allowSpectators: boolean;
  isPrivate: boolean;
  inviteCode?: string;
  themes: GameTheme[];
  restrictions: GameRestriction[];
}

export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert' | 'master';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type EmotionType = 'happy' | 'elegant' | 'confident' | 'playful' | 'mysterious' | 'romantic' | 'bold';

export interface GameTheme {
  id: string;
  name: string;
  description: string;
  requirements: StyleRequirement[];
  bonusMultiplier: number;
  timeLimit?: number;
  culturalContext?: CulturalStyle;
}

export interface StyleRequirement {
  category: 'color' | 'style' | 'cultural' | 'accessory' | 'mood' | 'era';
  value: string;
  weight: number; // How important this requirement is (1-10)
  bonus: number; // Extra points for meeting this requirement
}

export interface GameRestriction {
  type: 'no_modern' | 'single_culture' | 'color_limit' | 'accessory_limit' | 'budget_limit';
  value: any;
  description: string;
}

// Scoring and Performance Types
export interface ScoringSystem {
  basePoints: Record<string, number>;
  bonusMultipliers: Record<string, number>;
  penalties: Record<string, number>;
  maxScore: number;
  categories: ScoringCategory[];
}

export interface ScoringCategory {
  name: string;
  weight: number;
  criteria: ScoringCriterion[];
}

export interface ScoringCriterion {
  name: string;
  maxPoints: number;
  description: string;
  evaluator: 'ai' | 'peer' | 'expert' | 'community';
}

export interface ScoreBreakdown {
  totalScore: number;
  categoryScores: Record<string, number>;
  bonuses: ScoreBonus[];
  penalties: ScorePenalty[];
  multipliers: ScoreMultiplier[];
  ranking: number;
  percentile: number;
}

export interface ScoreBonus {
  type: string;
  name: string;
  points: number;
  description: string;
  trigger: string;
}

export interface ScorePenalty {
  type: string;
  name: string;
  points: number;
  description: string;
  trigger: string;
}

export interface ScoreMultiplier {
  type: string;
  factor: number;
  description: string;
  duration?: number; // seconds, if temporary
}

// Round and Voting Types
export interface GameRound {
  id: string;
  sessionId: string;
  roundNumber: number;
  theme: GameTheme;
  challenge: string;
  startTime: string;
  endTime?: string;
  status: 'preparing' | 'styling' | 'voting' | 'results' | 'completed';
  timeLimit: number;
  submissions: PlayerSubmission[];
  votes: Vote[];
  results: RoundResults;
}

export interface PlayerSubmission {
  id: string;
  participantId: string;
  roundId: string;
  avatarConfig: AvatarConfiguration;
  submittedAt: string;
  processingTime: number; // seconds taken to complete
  stylePoints: number;
  aiScore: number;
  isLateSubmission: boolean;
  metadata: SubmissionMetadata;
}

export interface Vote {
  id: string;
  voterId: string;
  roundId: string;
  votedForId: string;
  category: 'overall' | 'creativity' | 'cultural' | 'elegance' | 'originality';
  score: number;
  comment?: string;
  votedAt: string;
}

export interface RoundResults {
  winner: string;
  rankings: PlayerRanking[];
  categoryWinners: Record<string, string>;
  highlights: ResultHighlight[];
  statistics: RoundStatistics;
}

export interface PlayerRanking {
  participantId: string;
  position: number;
  totalScore: number;
  voteCount: number;
  categoryScores: Record<string, number>;
  achievements: Achievement[];
}

export interface ResultHighlight {
  type: 'best_style' | 'most_creative' | 'cultural_master' | 'speed_demon' | 'crowd_favorite';
  participantId: string;
  description: string;
  value: number;
}

// Statistics and Analytics Types
export interface GameStatistics {
  sessionId: string;
  totalDuration: number;
  averageRoundTime: number;
  participantRetention: number;
  popularStyles: StylePopularity[];
  culturalPreferences: Record<CulturalStyle, number>;
  performanceMetrics: PerformanceMetric[];
}

export interface PlayerSessionStats {
  totalTime: number;
  averageResponseTime: number;
  stylingSpeed: number;
  accuracy: number;
  consistency: number;
  creativityScore: number;
  culturalKnowledge: number;
  trendAwareness: number;
  votingAccuracy: number;
}

export interface StylePopularity {
  style: string;
  usage: number;
  winRate: number;
  averageScore: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

// Achievement System Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: ItemRarity;
  icon: string;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  unlockedAt?: string;
  progress: number; // 0-100
}

export type AchievementCategory = 
  | 'victory' 
  | 'skill' 
  | 'style' 
  | 'cultural' 
  | 'social' 
  | 'speed' 
  | 'consistency' 
  | 'creativity' 
  | 'special';

export interface AchievementRequirement {
  type: string;
  value: number;
  description: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface AchievementReward {
  type: 'points' | 'title' | 'avatar_item' | 'badge' | 'unlock';
  value: string | number;
  description: string;
}

// Real-time Communication Types
export interface GameMessage {
  id: string;
  sessionId: string;
  senderId: string;
  type: MessageType;
  content: any;
  timestamp: string;
  recipients?: string[]; // If not specified, broadcast to all
}

export type MessageType = 
  | 'game_action'
  | 'player_join'
  | 'player_leave' 
  | 'submission'
  | 'vote'
  | 'chat'
  | 'system'
  | 'heartbeat'
  | 'state_sync';

export interface RealtimeEvent {
  event: string;
  payload: any;
  timestamp: string;
  source: string;
}

// Error and Validation Types
export interface GameError {
  code: string;
  message: string;
  type: 'validation' | 'network' | 'timeout' | 'permission' | 'system';
  details?: any;
  recoverable: boolean;
  retryable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// Utility Types
export interface GameMetadata {
  version: string;
  platform: string;
  clientVersion: string;
  features: string[];
  region: string;
  language: string;
  timezone: string;
  customData: Record<string, any>;
}

export interface SubmissionMetadata {
  device: string;
  inputMethod: string;
  assistanceUsed: boolean;
  iterations: number;
  undoCount: number;
  timeSpentCategories: Record<string, number>;
}

export interface ColorConfig {
  primary: string;
  secondary?: string;
  accent?: string;
  opacity: number;
}

export interface Embellishment {
  type: string;
  placement: string;
  density: 'light' | 'medium' | 'heavy';
  material: string;
}

export interface AccessoryBonus {
  type: string;
  multiplier: number;
  conditions: string[];
}

export interface VisualEffect {
  type: string;
  intensity: number;
  duration?: number;
  trigger: string;
}

export interface RoundStatistics {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  participationRate: number;
  averageTime: number;
  styleDistribution: Record<string, number>;
  votingPatterns: Record<string, number>;
}