// Test the compatibility layer for pro forma functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecaamkrcsjrcjmcjshlu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYWFta3Jjc2pyY2ptY2pzaGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzMwMTYsImV4cCI6MjA3NDYwOTAxNn0.ndbsYfqCWDFGC9jFH1fUHL1rL_dfMn4sozAfDVa4KY8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompatibilityLayer() {
  console.log('Testing pro forma compatibility layer...');
  
  try {
    // First, authenticate with demo credentials
    console.log('\n1. Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo.junior@lexo.co.za',
      password: 'DemoPassword123!'
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      console.log('Trying with different credentials...');
      
      // Try senior demo account
      const { data: seniorAuth, error: seniorError } = await supabase.auth.signInWithPassword({
        email: 'demo.senior@lexo.co.za',
        password: 'DemoPassword123!'
      });
      
      if (seniorError) {
        console.log('❌ Senior auth also failed:', seniorError.message);
        return;
      } else {
        console.log('✅ Senior demo authenticated successfully');
        authData = seniorAuth;
      }
    } else {
      console.log('✅ Junior demo authenticated successfully');
    }
    
    // Test the compatibility layer logic
    console.log('\n2. Testing compatibility layer...');
    const token = 'test-compat-' + Date.now();
    
    // Try new schema first
    let insertData = {
      token,
      advocate_id: authData.user.id,
      client_name: 'Test Client',
      client_email: 'test@example.com',
      matter_description: 'Test matter description',
      matter_type: 'litigation',
      urgency_level: 'medium',
      status: 'pending'
    };

    let { error } = await supabase
      .from('pro_forma_requests')
      .insert(insertData);

    // If new schema fails, try with old schema compatibility
    if (error && error.message.includes('column')) {
      console.log('✅ New schema failed as expected, trying compatibility mode...');
      insertData = {
        token: token + '-compat',
        advocate_id: authData.user.id,
        client_name: 'Test Client',
        client_email: 'test@example.com',
        description: 'Test matter description', // fallback field
        urgency: 'medium', // fallback field
        status: 'pending'
      };

      const { data: compatData, error: fallbackError } = await supabase
        .from('pro_forma_requests')
        .insert(insertData)
        .select();
      
      if (fallbackError) {
        console.log('❌ Compatibility mode failed:', fallbackError.message);
      } else {
        console.log('✅ Compatibility mode succeeded!');
        console.log('Record created with ID:', compatData[0]?.id);
        
        // Clean up
        await supabase
          .from('pro_forma_requests')
          .delete()
          .eq('id', compatData[0].id);
        console.log('✅ Test record cleaned up');
      }
    } else if (error) {
      console.log('❌ Unexpected error:', error.message);
    } else {
      console.log('✅ New schema worked (migration already applied)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompatibilityLayer().then(() => {
  console.log('\nCompatibility test completed');
  process.exit(0);
}).catch(error => {
  console.error('Compatibility test error:', error);
  process.exit(1);
});