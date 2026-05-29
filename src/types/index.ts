export type Gender = 'Man' | 'Woman' | 'Trans Man' | 'Trans Woman' | 'Non-Binary' | 'Genderqueer' | 'Genderfluid' | 'Intersex' | 'Couple (MM)' | 'Couple (FF)' | 'Couple (MF)' | 'Group' | 'Other / Prefer Not to Say' | string;
export type Orientation = 'Gay' | 'Lesbian' | 'Bisexual' | 'Straight' | 'Pansexual' | 'Queer' | 'Heteroflexible' | 'Homoflexible' | 'Questioning' | 'Fluid' | string;
export type Position = 'Top' | 'Bottom' | 'Vers' | 'Vers Top' | 'Vers Bottom' | 'Dom' | 'Sub' | 'Switch' | 'Side' | 'Giver' | 'Receiver' | 'N/A' | 'Ask Me' | string;
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface SurgeUser {
  id: string;
  auth_id?: string;
  username: string;
  display_name: string;
  age: number;
  bio: string;
  gender: Gender;
  orientation: Orientation;
  lifestyle: string;
  looking_for: string[];
  kinks: string[];
  fantasies: string;
  body_type: string;
  ethnicity: string;
  weight: string;
  height: string;
  position: Position;
  health_status: string;
  tags: string[];
  photo_url: string;
  photo_urls: string[];
  lat: number;
  lng: number;
  last_seen: string;
  is_online: boolean;
  is_anonymous: boolean;
  is_verified: boolean;
  is_premium: boolean;
  premium_until?: string;
  free_trial_until?: string;
  blocked_users: string[];
  favorite_users: string[];
  profile_views: number;
  show_distance: boolean;
  show_on_map: boolean;
  auth_email?: string;
  safe_contact_name?: string;
  safe_contact_info?: string;
  distance?: number; // computed
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  status: MessageStatus;
  is_deleted?: boolean;
  reply_to_id?: string;
  created_date: string;
}

export interface Conversation {
  id: string;
  other_user: SurgeUser;
  last_message?: Message;
  unread_count: number;
  is_typing?: boolean;
}

export type AppView = 'landing' | 'onboarding' | 'map' | 'grid' | 'chat-list' | 'chat' | 'profile' | 'settings' | 'premium' | 'spots';

export const KINKS = [
  // Universal
  'Oral', 'Anal', 'Vaginal', 'Sensual', 'Vanilla', 'Rough', 'Gentle',
  'Foreplay', 'Edging', 'Outdoor / Public',
  // BDSM & Kink
  'BDSM', 'Bondage', 'Spanking', 'Dom / Sub', 'Discipline',
  'Roleplay', 'Uniform / Cosplay', 'Wax Play', 'Impact Play',
  // Fetish
  'Feet', 'Leather', 'Latex', 'Lingerie', 'Voyeurism', 'Exhibitionism',
  // Gay masc culture
  'Bears', 'Twinks', 'Daddies', 'Muscle Worship', 'Puppy Play',
  'Leather / Levi', 'Jocks',
  // Femme / lesbian culture
  'Soft Butch', 'Femme', 'Strap-On', 'Scissoring',
  // Couple & group
  'Threesome', 'Gangbang', 'Swapping', 'Hotwife', 'Cuckolding',
  'Voyeur Couple', 'MFM', 'FMF', 'FFM', 'MMM',
  // Other
  'Tantra', 'Pegging', 'Toys', 'Lingerie on Men', 'Cross-Dressing',
  'Age Play', 'Daddy / Boy', 'Mommy / Boy', 'Mommy / Girl'
];

export const LOOKING_FOR = [
  // Immediate
  'Right Now', 'Tonight', 'This Weekend',
  // Arrangements
  'NSA', 'FWB', 'Ongoing', 'Discreet',
  // Social
  'Dates', 'Friends', 'Chat', 'Relationship',
  // Group / couple play
  'Third', 'Fourth', 'Group', 'Couple Play', 'Bull / Stud',
  'Voyeur', 'Exhibitionist',
  // Other
  'Travel Buddy', 'Dom / Sub Arrangement', 'Open to Anything'
];

export const BODY_TYPES = [
  'Athletic', 'Muscular', 'Slim', 'Average', 'Bear', 'Otter',
  'Curvy', 'Dad Bod', 'Stocky', 'Chubby', 'Toned'
];

export const ETHNICITIES = [
  'White', 'Black', 'Latino', 'Asian', 'Middle Eastern',
  'South Asian', 'Mixed', 'Indigenous', 'Other', 'Prefer Not to Say'
];

export const HEALTH_STATUSES = [
  'Tested Negative', 'PrEP', 'Undetectable (U=U)', 'Vaccinated (Mpox)', 'Ask Me'
];

export const LIFESTYLES = [
  'Single', 'Dating', 'Open Relationship', 'Polyamorous',
  'Married (Open)', 'Swinger', 'Hotwife / Cuckold', 'ENM',
  'Partnered', 'Complicated'
];

export const GENDERS: Gender[] = [
  'Man', 'Woman', 'Trans Man', 'Trans Woman', 'Non-Binary',
  'Genderqueer', 'Genderfluid', 'Intersex',
  // Couples & groups
  'Couple (MM)', 'Couple (FF)', 'Couple (MF)', 'Group',
  'Other / Prefer Not to Say'
];

export const ORIENTATIONS: Orientation[] = [
  // LGBTQ+ first — this app is built for them
  'Gay', 'Lesbian', 'Bisexual',
  // Everyone else welcome
  'Straight', 'Pansexual', 'Queer', 'Heteroflexible', 'Homoflexible', 'Questioning', 'Fluid'
];

export const POSITIONS: Position[] = [
  'Top', 'Bottom', 'Vers', 'Vers Top', 'Vers Bottom',
  'Dom', 'Sub', 'Switch', 'Side', 'Giver', 'Receiver',
  'N/A', 'Ask Me'
];

export const PREMIUM_FEATURES = [
  { id: 'unlimited_likes', label: 'Unlimited Favorites', icon: '❤️', free: false },
  { id: 'see_who_viewed', label: 'See Who Viewed You', icon: '👁️', free: false },
  { id: 'incognito_browse', label: 'Incognito Browsing', icon: '🥷', free: false },
  { id: 'advanced_filters', label: 'Advanced Filters', icon: '🎛️', free: false },
  { id: 'boost', label: 'Profile Boost (2x visibility)', icon: '🚀', free: false },
  { id: 'read_receipts', label: 'Read Receipts', icon: '✓✓', free: true },
  { id: 'media_chat', label: 'Photo/Video in Chat', icon: '📷', free: true },
  { id: 'map_view', label: 'Live Map View', icon: '🗺️', free: true },
  { id: 'anonymous_mode', label: 'Anonymous Mode', icon: '🫥', free: false },
  { id: 'no_ads', label: 'Ad-Free Experience', icon: '🚫', free: false },
];

// ── Hookup Rating / Reliability Score ─────────────────────────
export interface HookupRating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  meetup_happened: boolean;        // Did it actually happen?
  reliability_score: 1 | 2 | 3 | 4 | 5; // 1=flaked, 5=solid
  vibe_score?: 1 | 2 | 3 | 4 | 5;       // How was it? (optional, private)
  tags: RatingTag[];
  comment?: string;                // Optional short note (private)
  created_date: string;
}

export type RatingTag =
  | 'showed_up'
  | 'flaked_last_minute'
  | 'great_vibes'
  | 'no_show'
  | 'pics_accurate'
  | 'pics_not_accurate'
  | 'clean_safe'
  | 'respectful'
  | 'rushed_me'
  | 'ghosted_after';

export const RATING_TAGS: { value: RatingTag; label: string; emoji: string }[] = [
  { value: 'showed_up',           label: 'Showed Up',         emoji: '✅' },
  { value: 'flaked_last_minute',  label: 'Flaked Last Min',   emoji: '⚠️' },
  { value: 'great_vibes',         label: 'Great Vibes',       emoji: '🔥' },
  { value: 'no_show',             label: 'No-Show',           emoji: '❌' },
  { value: 'pics_accurate',       label: 'Pics Accurate',     emoji: '📸' },
  { value: 'pics_not_accurate',   label: 'Pics Not Accurate', emoji: '🚩' },
  { value: 'clean_safe',          label: 'Clean & Safe',      emoji: '✨' },
  { value: 'respectful',          label: 'Respectful',        emoji: '💯' },
  { value: 'rushed_me',           label: 'Rushed Me',         emoji: '⏩' },
  { value: 'ghosted_after',       label: 'Ghosted After',     emoji: '👻' },
];

export interface UserReliabilityStats {
  reliability_avg: number;   // 1–5
  vibe_avg?: number;         // 1–5
  total_ratings: number;
  showed_up_pct: number;     // % who actually showed
  badge?: 'Solid' | 'Reliable' | 'Flaky' | 'Ghost';
}

// ── Ads / Monetization ────────────────────────────────────────
export interface SurgeAd {
  id: string;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url?: string;
  sponsor_name: string;
  ad_type: 'banner' | 'card' | 'interstitial';
  is_active: boolean;
  impressions: number;
  clicks: number;
  created_date: string;
}

// ── Referral System ───────────────────────────────────────────
export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface ReferralStats {
  user_id: string;
  referral_code: string;
  total_referrals: number;
  signed_up: number;
  stayed_30_days: number;
  total_free_days_earned: number;
}

export interface RewardLog {
  id: string;
  user_id: string;
  reward_type: string;
  reward_value: string;
  referral_id: string;
  granted_at: string;
}

export const REFERRAL_REWARDS = [
  {
    milestone: 'send',
    label: 'Send an invite',
    description: 'Share your link — nothing yet, but it counts 😏',
    reward: null,
    emoji: '📨',
  },
  {
    milestone: 'signup',
    label: 'They sign up',
    description: '+7 days of free Premium added to your account',
    reward: '7_days_premium',
    emoji: '🎉',
  },
  {
    milestone: 'day30',
    label: 'They stay 30+ days',
    description: '+30 days Premium + Incognito Mode unlocked free',
    reward: '30_days_premium',
    emoji: '🔥',
  },
] as const;
