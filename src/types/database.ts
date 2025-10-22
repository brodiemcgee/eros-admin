export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  created_by: string | null;
  last_login_at: string | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  metadata: Record<string, any>;
};

export type ModerationActionType =
  | 'ban_user'
  | 'unban_user'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'verify_user'
  | 'unverify_user'
  | 'delete_photo'
  | 'approve_photo'
  | 'reject_photo'
  | 'resolve_report'
  | 'dismiss_report'
  | 'add_note'
  | 'send_warning'
  | 'delete_account'
  | 'grant_credits'
  | 'refund_payment'
  | 'approve_age_verification'
  | 'reject_age_verification'
  | 'update_subscription'
  | 'force_logout'
  | 'edit_profile'
  | 'other';

export type ModerationAction = {
  id: string;
  created_at: string;
  admin_id: string;
  action_type: ModerationActionType;
  target_user_id: string | null;
  target_content_id: string | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  result: string;
};

export type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export type PhotoModerationQueue = {
  id: string;
  photo_id: string;
  user_id: string;
  submitted_at: string;
  status: PhotoStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  ai_moderation_score: number | null;
  ai_flags: string[] | null;
  notes: string | null;
};

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'expired' | 'trialing';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_amount: number;
  currency: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  cancelled_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  bio: string | null;
  date_of_birth: string;
  city: string;
  country: string;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

export type AgeVerificationRequest = {
  id: string;
  user_id: string;
  verification_method: string;
  status: string;
  submitted_at: string;
  document_url: string | null;
  document_type: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  metadata: Record<string, any>;
};

export type GdprRequest = {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  data_delivered_at: string | null;
  admin_notes: string | null;
  metadata: Record<string, any>;
};

export type ContentFlag = {
  id: string;
  reported_by: string | null;
  target_user_id: string;
  target_content_id: string | null;
  content_type: string | null;
  flag_type: string;
  description: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution: string | null;
};

export type DataExportRequest = GdprRequest;
export type ContentModerationFlag = ContentFlag;
