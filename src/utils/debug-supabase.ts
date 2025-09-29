import { supabase } from '../lib/supabase';

export const debugSupabaseConnection = async () => {
  console.log('🔍 Debugging Supabase Connection...');
  
  try {
    // Check environment variables
    console.log('Environment Variables:');
    console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('- VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log('- Supabase client URL:', supabase.supabaseUrl);
    console.log('- Supabase client key exists:', !!supabase.supabaseKey);
    
    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Authentication Status:');
    console.log('- User:', user ? `${user.email} (${user.id})` : 'Not authenticated');
    console.log('- Auth Error:', authError);
    
    // Test basic connection with a simple query
    console.log('Testing basic connection...');
    const { data, error } = await supabase
      .from('advocates')
      .select('count')
      .limit(1);
    
    console.log('Connection Test Result:');
    console.log('- Data:', data);
    console.log('- Error:', error);
    
    // Test invoices table specifically
    console.log('Testing invoices table access...');
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('count')
      .limit(1);
    
    console.log('Invoices Table Test:');
    console.log('- Data:', invoicesData);
    console.log('- Error:', invoicesError);
    
    return {
      environmentOk: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      authenticated: !!user,
      connectionOk: !error,
      invoicesAccessOk: !invoicesError
    };
    
  } catch (error) {
    console.error('Debug failed:', error);
    return {
      environmentOk: false,
      authenticated: false,
      connectionOk: false,
      invoicesAccessOk: false,
      error
    };
  }
};