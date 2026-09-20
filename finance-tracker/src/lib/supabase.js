import { createClient } from '@supabase/supabase-js';

// Paste your actual credentials inside these quotes
const supabaseUrl = 'https://toahvfxuioygfvqjsluy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYWh2Znh1aW95Z2Z2cWpzbHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjY2MjYsImV4cCI6MjEwNTQwMjYyNn0.DTjcP5ZVS90Ux-8jq-ZQB8lQLN92HSSaf7mtTJy8GCQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);