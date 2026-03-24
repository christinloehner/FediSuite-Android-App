export type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
  };
  isAdmin: boolean;
  auth: {
    type: 'Bearer';
  };
};

export type BootstrapAccount = {
  id: number;
  instance_url: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stats_followers: number;
  stats_following: number;
  stats_statuses: number;
  max_characters: number;
  characters_reserved_per_url: number;
  max_media_attachments: number;
  instance_type: string;
  import_status: string | null;
  auth_error_code: string | null;
  auth_error_message: string | null;
  auth_error_at: string | null;
  created_at: string;
  is_default: boolean;
  indexed_posts_count: number;
  effective_statuses_count: number;
};

export type BootstrapResponse = {
  server_time: string;
  public_config: {
    enableUserRegistration?: boolean;
    appName?: string;
    publicSiteUrl?: string;
  };
  notice: {
    enabled: boolean;
    markdown: string;
  };
  user: {
    id: number;
    email: string;
    timezone: string;
    default_account_id: number | null;
    language: string;
    theme: 'dark' | 'light' | string;
    is_admin: boolean;
  };
  summary: {
    account_count: number;
    total_followers: number;
    total_following: number;
    total_statuses: number;
    scheduled_posts: number;
    failed_posts: number;
    published_posts: number;
    draft_posts: number;
    total_posts: number;
    importing_accounts: number;
    accounts_with_auth_errors: number;
  };
  accounts: BootstrapAccount[];
  mobile_capabilities: {
    dashboard_periods: number[];
    top_post_sort_options: string[];
    top_hashtag_sort_options: string[];
    supports_preferences_batch_update: boolean;
  };
};

export type MobilePreferencesResponse = {
  success: boolean;
  profile: {
    id: number;
    email: string;
    timezone: string;
    default_account_id: number | null;
    language: string;
    theme: string;
  };
};

export type AccountDashboardResponse = {
  server_time: string;
  period: {
    days: number;
    all_time: boolean;
    available_periods: number[];
  };
  account: {
    id: number;
    instance_url: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    instance_type: string;
    import_status: string | null;
    auth_error_code: string | null;
    auth_error_message: string | null;
    effective_statuses_count: number;
    scheduled_posts_count: number;
    failed_posts_count: number;
    published_posts_count: number;
    draft_posts_count: number;
    last_recorded_at: string | null;
  };
  summary: {
    followers: number;
    following: number;
    statuses: number;
    indexed_posts_count: number;
    effective_statuses_count: number;
    scheduled_posts_count: number;
    failed_posts_count: number;
    published_posts_count: number;
    draft_posts_count: number;
    posts_in_period: number;
    media_posts_in_period: number;
    text_posts_in_period: number;
    total_favourites: number;
    total_boosts: number;
    total_replies: number;
    total_engagement: number;
    avg_engagement_per_post: number;
    latest_stats_at: string | null;
  };
  charts: {
    daily_stats?: unknown[];
    engagement_rate?: unknown[];
    stats_history?: unknown[];
    weekly_growth?: unknown[];
    follower_events?: unknown[];
    best_times?: unknown[];
    media_performance?: {
      media_posts?: number;
      text_posts?: number;
      media_avg_engagement?: number;
      text_avg_engagement?: number;
      [key: string]: unknown;
    };
    visibility_breakdown?: Array<{
      visibility?: string;
      count?: number;
      posts_count?: number;
      total_engagement?: number;
    }>;
    hashtag_overview?: {
      total_posts?: number;
      posts_with_hashtags?: number;
      posts_without_hashtags?: number;
      hashtag_uses?: number;
      unique_hashtags?: number;
      avg_hashtags_per_post?: number;
    };
    top_hashtags?: Array<{
      tag?: string;
      posts_count?: number;
      total_engagement?: number;
      avg_engagement?: number;
    }>;
    hashtag_combinations?: Array<{
      tags?: string[] | string;
      posts_count?: number;
      total_engagement?: number;
      avg_engagement?: number;
    }>;
    [key: string]: unknown;
  };
  top_posts: {
    sort: string;
    available_sorts: string[];
    items: Array<{
      id?: number;
      content?: string;
      created_at?: string;
      total_engagement?: number;
      favourites_count?: number;
      reblogs_count?: number;
      replies_count?: number;
      visibility?: string;
      has_media?: boolean;
      external_url?: string | null;
    }>;
  };
  insights: {
    tips?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      reason?: string;
      confidence?: string;
      priority?: number;
      evidence?: string[] | string | Record<string, unknown>;
    }>;
    meta?: Record<string, unknown>;
  };
};

export type QueuePost = {
  id: number;
  accountId?: number;
  account_id?: number;
  content?: string;
  title?: string | null;
  spoilerText?: string | null;
  spoiler_text?: string | null;
  status?: string | null;
  visibility?: string | null;
  language?: string | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  publishedAt?: string | null;
  published_at?: string | null;
  failedAt?: string | null;
  failed_at?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  error?: string | null;
  error_message?: string | null;
  media_files?: string[] | string | null;
  media_thumbnails?: string[] | string | null;
  account_username?: string | null;
  account_avatar?: string | null;
  account_instance_url?: string | null;
  account_instance_type?: string | null;
  [key: string]: unknown;
};
