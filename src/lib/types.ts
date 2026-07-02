export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  genre: string | null;
  website: string | null;
  social_links: SocialLinks;
  discord_handle: string | null;
  email?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: number;
  number: number;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

export interface Episode {
  id: string;
  season_id: number;
  episode_number: number;
  title: string | null;
  description: string | null;
  air_date: string | null;
  status: string;
  submissions_open: boolean;
  youtube_url: string | null;
  podcast_url: string | null;
  guest_judges: string[] | null;
  created_at: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  soundcloud?: string;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  location: string | null;
  genre: "songwriter" | "producer" | "mix_engineer" | "multi";
  bio: string | null;
  discord_handle: string | null;
  social_links: SocialLinks;
  track_url: string;
  track_signed_url: string | null;
  track_title: string | null;
  track_duration: string | null;
  sample_rate: number | null;
  bit_depth: number | null;
  file_format: string | null;
  waveform_data: number[] | null;
  status: "submitted" | "under_review" | "selected" | "aired" | "scored";
  episode_id: string | null;
  season_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  submission_id: string;
  episode_id: string;
  host_score: number | null;
  guest_scores: Record<string, number>;
  audience_score: number | null;
  notes: string | null;
  golden_knob: boolean;
  metric_low_end: number | null;
  metric_clarity: number | null;
  metric_balance: number | null;
  metric_mid_range: number | null;
  metric_image: number | null;
  metric_high_end: number | null;
  metric_overall: number | null;
  combined_score: number | null;
  viewer_avg: number | null;
  viewer_vote_count: number | null;
  judge_scores: Record<string, any>;
  created_at: string;
}

export const GENRE_OPTIONS = [
  { value: "songwriter", label: "Songwriter" },
  { value: "producer", label: "Producer" },
  { value: "mix_engineer", label: "Mix Engineer" },
  { value: "multi", label: "Multi-Discipline" },
] as const;

export const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "selected", label: "Selected" },
  { value: "aired", label: "Aired" },
  { value: "scored", label: "Scored" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  submitted: "border-[#D4A843] text-[#D4A843]",
  under_review: "bg-[#E89B2E] text-[#1A0F0A]",
  selected: "bg-[#D4A843] text-[#1A0F0A]",
  aired: "bg-green-700 text-white",
  scored: "bg-purple-700 text-white",
};

// ═══════════════════════════════════════════
// FORUM TYPES
// ═══════════════════════════════════════════

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  thread_count: number;
  post_count: number;
  created_at: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  slug: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_score: number;
  last_reply_at: string | null;
  last_reply_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  category?: ForumCategory;
  user_vote?: number;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  is_solution: boolean;
  vote_score: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  user_vote?: number;
  children?: ForumReply[];
}

export interface ForumVote {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'thread' | 'reply';
  vote_type: -1 | 1;
  created_at: string;
}

export interface ForumAudioEmbed {
  id: string;
  post_id: string;
  post_type: 'thread' | 'reply';
  audio_url: string;
  waveform_peaks: number[] | null;
  title: string | null;
  duration_seconds: number | null;
  file_format: string | null;
  sample_rate: number | null;
  created_at: string;
}

// ═══════════════════════════════════════════
// CLASSIFIEDS TYPES
// ═══════════════════════════════════════════

export interface ClassifiedListing {
  id: string;
  author_id: string;
  listing_type: 'lfw' | 'lfm';
  title: string;
  description: string;
  genres: string[];
  rate_per_song: number | null;
  rate_per_hour: number | null;
  rate_per_stem: number | null;
  turnaround_days: number | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  specialties: string[];
  portfolio_url: string | null;
  reference_tracks: string | null;
  is_featured: boolean;
  featured_until: string | null;
  is_verified: boolean;
  is_bumped: boolean;
  bumped_until: string | null;
  status: 'active' | 'paused' | 'closed' | 'hired';
  view_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  author?: Profile;
  avg_rating?: number;
  review_count?: number;
}

export interface ClassifiedReview {
  id: string;
  listing_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text: string | null;
  project_type: string | null;
  created_at: string;
  reviewer?: Profile;
}

export interface ClassifiedContact {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════
// PORTFOLIO TYPES
// ═══════════════════════════════════════════

export type SubscriptionTier = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTrack {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  role: string;
  audio_url: string;
  waveform_peaks: number[] | null;
  duration_seconds: number | null;
  file_format: string | null;
  sample_rate: number | null;
  bit_depth: number | null;
  file_size_bytes: number | null;
  play_count: number;
  download_count: number;
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSettings {
  user_id: string;
  theme: string;
  layout: string;
  headline: string | null;
  custom_bio: string | null;
  gear_list: string[];
  client_testimonials: PortfolioTestimonial[];
  contact_email: string | null;
  contact_form_enabled: boolean;
  show_rates: boolean;
  hourly_rate: number | null;
  per_song_rate: number | null;
  custom_domain: string | null;
  analytics_enabled: boolean;
  social_links: SocialLinks;
  show_badge: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioTestimonial {
  name: string;
  quote: string;
  project?: string;
}

export interface PortfolioAnalytics {
  id: string;
  user_id: string;
  event_type: 'page_view' | 'track_play' | 'track_download' | 'contact_click' | 'share';
  track_id: string | null;
  referrer: string | null;
  visitor_country: string | null;
  created_at: string;
}

export interface PortfolioContact {
  id: string;
  portfolio_user_id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  project_type: string | null;
  budget_range: string | null;
  read_at: string | null;
  created_at: string;
}
