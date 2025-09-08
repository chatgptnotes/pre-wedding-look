export interface SelectionOption {
  id: string;
  label: string;
  imageUrl: string;
  promptValue: string;
}

export type ConfigCategory = 'location' | 'brideAttire' | 'groomAttire' | 'bridePose' | 'groomPose' | 'style' | 'hairstyle' | 'groomHairstyle' | 'aspectRatio' | 'jewelry';


export interface GenerationConfig {
  location: string;
  brideAttire: string;
  groomAttire: string;
  bridePose: string;
  groomPose: string;
  style: string;
  hairstyle: string;
  groomHairstyle: string;
  aspectRatio: string;
  jewelry: string;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

export interface OptionUpdate {
  category: ConfigCategory;
  promptValue: string;
}

// Discriminated union for more robust type safety
interface SetOptionAction {
  action: 'set_option';
  updates: OptionUpdate[];
  responseText: string;
}

interface ChatAction {
  action: 'chat';
  updates?: never;
  responseText: string;
}

export type ChatbotAction = SetOptionAction | ChatAction;

// Favorites/Wishlist types
export interface FavoriteItem {
  id: string;
  user_id: string;
  image_id: string;
  image_url: string;
  image_type: 'bride' | 'groom' | 'couple';
  config_used: GenerationConfig;
  title: string | null;
  notes: string | null;
  created_at: string;
}

// Comparison types
export interface ComparisonItem {
  id: string;
  imageUrl: string;
  config: GenerationConfig;
  imageType: 'bride' | 'groom' | 'couple';
  title?: string;
}

// Social sharing types
export interface ShareableImage {
  imageUrl: string;
  title: string;
  description?: string;
  config: GenerationConfig;
}

// Blind Date Style-Off Types
export interface BlindDateSession {
  id: string;
  status: 'waiting' | 'active' | 'reveal' | 'finished';
  is_private: boolean;
  invite_code?: string;
  created_at: string;
  ended_at?: string;
}

export interface BlindDateParticipant {
  session_id: string;
  user_id: string;
  role: 'A' | 'B';
  joined_at: string;
  is_revealed: boolean;
  avatar_name: string;
  is_me?: boolean;
}

export interface BlindDateRound {
  id: string;
  session_id: string;
  round_no: number;
  topic: 'attire' | 'hair' | 'location';
  started_at: string;
  ended_at?: string;
  time_limit_seconds: number;
}

export interface BlindDateDesign {
  id: string;
  session_id: string;
  round_id: string;
  designer_user_id: string;
  target_role: 'A' | 'B';
  prompt: any;
  image_url?: string;
  created_at: string;
}

export interface BlindDateFeedback {
  id: string;
  session_id: string;
  voter_user_id: string;
  vote?: 'A' | 'B' | 'tie';
  reaction?: 'heart' | 'fire' | 'laugh' | 'surprise';
  created_at: string;
}

export interface BlindDateGameState {
  session: BlindDateSession;
  my_role: 'A' | 'B';
  my_avatar_name: string;
  participants: BlindDateParticipant[];
  rounds: BlindDateRound[];
  current_round?: BlindDateRound;
  designs: BlindDateDesign[];
  my_designs: BlindDateDesign[];
}

// Game UI Types
export interface GameTimer {
  minutes: number;
  seconds: number;
  isActive: boolean;
  totalSeconds: number;
}

export interface StyleChoice {
  category: 'attire' | 'hair' | 'location';
  option: string;
  value: any;
}

export interface GameReaction {
  type: 'heart' | 'fire' | 'laugh' | 'surprise';
  emoji: string;
  label: string;
}