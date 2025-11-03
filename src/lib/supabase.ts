import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});


export type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type Dream = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  dream_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Like = {
  id: string;
  dream_id: string;
  user_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Block = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_dream_id?: string;
  reported_user_id?: string;
  reason: string;
  created_at: string;
};
