import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuwzjtfspfpdctrlxtj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXd6anRmc3BmZHBjdHJseHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDY2ODQsImV4cCI6MjA5ODM4MjY4NH0.tmpI_QALCbDfihjvBfCEyciXA-TgZXOY_dbm0hR04S0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
