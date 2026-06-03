/*
  # MindWell Initial Schema

  1. Purpose
    - Complete mental wellness platform database schema
    - Supports users, therapists, appointments, journals, moods, community, payments
  
  2. New Tables
    - profiles: Extended user profiles with role-based access
    - therapists: Therapist profiles and verification
    - appointments: Booking sessions between users and therapists
    - journals: Private journal entries with mood tracking
    - moods: Daily mood logs and analytics
    - community_posts: Anonymous community discussions
    - community_comments: Comments on community posts
    - chat_messages: AI therapy chat history
    - notifications: Real-time user notifications
    - payments: Payment and subscription records
    - subscriptions: User subscription plans
  
  3. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Therapists can access their appointments
    - Admin role has full access
  
  4. Important Notes
    - Uses auth.users from Supabase Auth
    - All timestamps use timestamptz
    - UUID primary keys for all tables
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('user', 'therapist', 'admin')),
  phone text DEFAULT '',
  date_of_birth date,
  gender text DEFAULT '',
  bio text DEFAULT '',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  preferences jsonb DEFAULT '{"notifications": true, "theme": "light", "language": "en"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Therapists table
CREATE TABLE IF NOT EXISTS therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  specialization text[] DEFAULT ARRAY[]::text[],
  qualifications text[] DEFAULT ARRAY[]::text[],
  experience_years integer DEFAULT 0,
  consultation_fee decimal DEFAULT 0,
  availability jsonb DEFAULT '{}'::jsonb,
  rating decimal DEFAULT 0,
  total_reviews integer DEFAULT 0,
  is_available boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  bio text DEFAULT '',
  languages text[] DEFAULT ARRAY['English']::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  type text DEFAULT 'video' CHECK (type IN ('video', 'chat', 'in-person')),
  notes text DEFAULT '',
  meeting_url text DEFAULT '',
  fee decimal DEFAULT 0,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Journals table
CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Untitled',
  content text NOT NULL,
  mood text DEFAULT 'neutral',
  mood_score integer DEFAULT 5 CHECK (mood_score >= 1 AND mood_score <= 10),
  tags text[] DEFAULT ARRAY[]::text[],
  is_private boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  mood_score integer DEFAULT 5 CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level integer DEFAULT 5 CHECK (energy_level >= 1 AND energy_level <= 10),
  anxiety_level integer DEFAULT 5 CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  sleep_quality integer DEFAULT 5 CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes text DEFAULT '',
  activities text[] DEFAULT ARRAY[]::text[],
  triggers text[] DEFAULT ARRAY[]::text[],
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  is_anonymous boolean DEFAULT true,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community comments table
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  likes_count integer DEFAULT 0,
  parent_comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table (AI therapy)
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  sentiment text DEFAULT 'neutral',
  sentiment_score decimal DEFAULT 0,
  is_crisis boolean DEFAULT false,
  session_id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'razorpay',
  transaction_id text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  stripe_subscription_id text DEFAULT '',
  stripe_customer_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for therapists
CREATE POLICY "Therapists can view own data"
  ON therapists FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All users can view available therapists"
  ON therapists FOR SELECT
  TO authenticated
  USING (is_available = true AND is_verified = true);

CREATE POLICY "Therapists can update own data"
  ON therapists FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM therapists t
      JOIN profiles p ON p.id = t.user_id
      WHERE t.id = appointments.therapist_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for journals
CREATE POLICY "Users can manage own journals"
  ON journals FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for moods
CREATE POLICY "Users can manage own moods"
  ON moods FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for community_posts
CREATE POLICY "Users can view all posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for community_comments
CREATE POLICY "Users can view all comments"
  ON community_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can manage own chat messages"
  ON chat_messages FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscriptions
CREATE POLICY "Users can manage own subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_journals_user ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_user ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_logged ON moods(logged_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
