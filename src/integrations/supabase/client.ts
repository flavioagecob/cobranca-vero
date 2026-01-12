import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nsdisfhrgxatxaenyrbx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZGlzZmhyZ3hhdHhhZW55cmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxMTcsImV4cCI6MjA4MzgyMjExN30.SnpqPJIa2yEeRVj92e2mDqC3Nryhem9x7SqL6iye2e0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
