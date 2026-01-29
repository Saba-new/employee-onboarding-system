import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://iuglpghgwsqavuyywgsz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z2xwZ2hnd3NxYXZ1eXl3Z3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA2MDQsImV4cCI6MjA4NTA5NjYwNH0.yP2pR3KkFzKjqX8RJxqCZDKFPXcT7rVRLN-TGlP0_fU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
