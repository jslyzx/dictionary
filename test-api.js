const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test GET words
    const response = await axios.get('http://localhost:3000/api/words');
    console.log('GET /api/words response:', response.data);
    
    // Test POST word
    const newWord = {
      word: 'test',
      phonetic: '/test/',
      meaning: 'A test word',
      difficulty: 0,
      isMastered: false
    };
    
    const createResponse = await axios.post('http://localhost:3000/api/words', newWord);
    console.log('POST /api/words response:', createResponse.data);
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI();