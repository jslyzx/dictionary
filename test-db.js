const { testConnection, query } = require('./config/db');

async function test() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    console.log('Connected:', connected);
    
    if (connected) {
      console.log('Testing query...');
      const words = await query('SELECT COUNT(*) as count FROM words');
      console.log('Words count:', words[0].count);
      
      const dictionaries = await query('SELECT COUNT(*) as count FROM dictionaries');
      console.log('Dictionaries count:', dictionaries[0].count);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
}

test();