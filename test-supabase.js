import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pzelfekjkolyxyrgmsgb.supabase.co',
  'sb_publishable_0T_PUO26VvwgP-sFkCccrw_FDi9aRt-'
);

async function testSupabase() {
  try {
    console.log('🔄 Testing Supabase connection...');

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Supabase query error:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Data:', data);
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

testSupabase();