/*
  # Dream Sharing Social App Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `bio` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `dreams`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `content` (text)
      - `image_url` (text)
      - `is_public` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `comments`
      - `id` (uuid, primary key)
      - `dream_id` (uuid, references dreams)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)
    
    - `likes`
      - `id` (uuid, primary key)
      - `dream_id` (uuid, references dreams)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (dream_id, user_id)
    
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles)
      - `following_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (follower_id, following_id)
    
    - `blocks`
      - `id` (uuid, primary key)
      - `blocker_id` (uuid, references profiles)
      - `blocked_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - Unique constraint on (blocker_id, blocked_id)
    
    - `reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `reported_dream_id` (uuid, references dreams, nullable)
      - `reported_user_id` (uuid, references profiles, nullable)
      - `reason` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their own data
    - Policies for public access to public dreams
    - Policies for social interactions (likes, comments, follows)
    - Policies to respect blocks (blocked users cannot see blocker's content)

  3. Indexes
    - Added indexes for frequently queried columns
    - Composite indexes for relationship tables

  4. Functions
    - Trigger to automatically create profile on user signup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dreams table
CREATE TABLE IF NOT EXISTS dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  image_url text DEFAULT '',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id uuid REFERENCES dreams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id uuid REFERENCES dreams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dream_id, user_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_dream_id uuid REFERENCES dreams(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (reported_dream_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dreams_user_id ON dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dreams_is_public ON dreams(is_public);
CREATE INDEX IF NOT EXISTS idx_comments_dream_id ON comments(dream_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_dream_id ON likes(dream_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Dreams policies
CREATE POLICY "Public dreams are viewable by everyone"
  ON dreams FOR SELECT
  USING (
    is_public = true 
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocked_id = auth.uid() 
      AND blocker_id = dreams.user_id
    )
  );

CREATE POLICY "Users can view their own dreams"
  ON dreams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view dreams from people they follow"
  ON dreams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() 
      AND following_id = dreams.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocked_id = auth.uid() 
      AND blocker_id = dreams.user_id
    )
  );

CREATE POLICY "Users can insert their own dreams"
  ON dreams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams"
  ON dreams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams"
  ON dreams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable if dream is viewable"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dreams 
      WHERE dreams.id = comments.dream_id 
      AND (
        dreams.is_public = true 
        OR dreams.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM follows 
          WHERE follower_id = auth.uid() 
          AND following_id = dreams.user_id
        )
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE blocked_id = auth.uid() 
      AND blocker_id = comments.user_id
    )
  );

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      JOIN dreams d ON d.id = dream_id
      WHERE (b.blocker_id = d.user_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = d.user_id)
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable if dream is viewable"
  ON likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dreams 
      WHERE dreams.id = likes.dream_id 
      AND (
        dreams.is_public = true 
        OR dreams.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      JOIN dreams d ON d.id = dream_id
      WHERE (b.blocker_id = d.user_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = d.user_id)
    )
  );

CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by involved users"
  ON follows FOR SELECT
  TO authenticated
  USING (
    auth.uid() = follower_id 
    OR auth.uid() = following_id
  );

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = following_id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = following_id)
    )
  );

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Blocks policies
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
  ON blocks FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON dreams;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON dreams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();