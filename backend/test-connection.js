/**
 * Test Supabase Connection
 * Run this to verify your Supabase credentials are correct
 */

const supabase = require('./src/config/supabase');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if client is created
    console.log('✓ Supabase client created successfully');

    // Test 2: Query employees table
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      return;
    }

    console.log('✓ Database connection successful');
    console.log('✓ Employees table accessible');
    
    if (data && data.length > 0) {
      console.log(`✓ Found ${data.length} test record in employees table`);
      console.log('\nSample data:', {
        id: data[0].id,
        email: data[0].email,
        role: data[0].role
      });
    } else {
      console.log('ℹ️  Employees table is empty (this is okay)');
    }

    console.log('\n🎉 Supabase connection is working perfectly!');
    
  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
    process.exit(1);
  }
}

// Run the test
testConnection();
