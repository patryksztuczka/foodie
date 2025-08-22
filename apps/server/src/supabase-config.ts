import { createClient } from '@supabase/supabase-js';
import { type Database } from './types/supabase.ts';

const supabaseUrl = 'https://ihuaqeiqrxhanhzrqanz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
