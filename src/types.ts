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