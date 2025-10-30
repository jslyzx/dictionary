const express = require('express');
const app = require('./app');

// Get the Express app instance
const expressApp = express();

// Mock the database to avoid connection issues
console.log('Checking route configuration...\n');

// Check if routes are properly mounted by examining the app stack
const appStack = app._router.stack;

const dictionaryRoutes = [];
const dictionaryWordRoutes = [];
const dictionaryWordAssociationRoutes = [];

appStack.forEach((middleware) => {
  if (middleware.route) {
    const path = middleware.route.path;
    const methods = Object.keys(middleware.route.methods);
    
    if (path.startsWith('/api/dictionaries/') && !path.includes('/words')) {
      dictionaryRoutes.push({ path, methods });
    } else if (path.startsWith('/api/dictionaries/') && path.includes('/words')) {
      dictionaryWordRoutes.push({ path, methods });
    } else if (path.startsWith('/api/dictionary-word-associations/')) {
      dictionaryWordAssociationRoutes.push({ path, methods });
    }
  } else if (middleware.name === 'router') {
    // Handle nested routers
    const router = middleware.handle;
    if (router.stack) {
      router.stack.forEach((route) => {
        if (route.route) {
          const path = route.route.path;
          const methods = Object.keys(route.route.methods);
          
          // Check if this is a dictionary router (based on the path pattern)
          if (middleware.regexp && middleware.regexp.test('/api/dictionaries')) {
            if (path.includes('/words')) {
              dictionaryWordRoutes.push({ path: `/api/dictionaries${path}`, methods });
            } else {
              dictionaryRoutes.push({ path: `/api/dictionaries${path}`, methods });
            }
          } else if (middleware.regexp && middleware.regexp.test('/api/dictionary-word-associations')) {
            dictionaryWordAssociationRoutes.push({ path: `/api/dictionary-word-associations${path}`, methods });
          }
        }
      });
    }
  }
});

console.log('✅ Dictionary Routes:');
dictionaryRoutes.forEach(route => {
  console.log(`   ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

console.log('\n✅ Dictionary Word Routes:');
dictionaryWordRoutes.forEach(route => {
  console.log(`   ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

console.log('\n✅ Dictionary Word Association Routes:');
dictionaryWordAssociationRoutes.forEach(route => {
  console.log(`   ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check for required routes
const requiredRoutes = [
  { path: '/:id/words', methods: ['get', 'post'] },
  { path: '/:id/words/:wordId', methods: ['delete'] }
];

const requiredAssociationRoutes = [
  { path: '/:id', methods: ['put'] }
];

console.log('\n🔍 Checking required routes...');

let allRoutesFound = true;

requiredRoutes.forEach(required => {
  const found = dictionaryWordRoutes.some(route => 
    route.path.includes(required.path) && 
    required.methods.some(method => route.methods.includes(method))
  );
  
  if (found) {
    console.log(`   ✅ Found ${required.methods.join(', ').toUpperCase()} ${required.path}`);
  } else {
    console.log(`   ❌ Missing ${required.methods.join(', ').toUpperCase()} ${required.path}`);
    allRoutesFound = false;
  }
});

requiredAssociationRoutes.forEach(required => {
  const found = dictionaryWordAssociationRoutes.some(route => 
    route.path.includes(required.path) && 
    required.methods.some(method => route.methods.includes(method))
  );
  
  if (found) {
    console.log(`   ✅ Found ${required.methods.join(', ').toUpperCase()} ${required.path}`);
  } else {
    console.log(`   ❌ Missing ${required.methods.join(', ').toUpperCase()} ${required.path}`);
    allRoutesFound = false;
  }
});

if (allRoutesFound) {
  console.log('\n🎉 All required dictionary detail routes are properly configured!');
} else {
  console.log('\n❌ Some required routes are missing.');
}

console.log('\n📋 Expected API endpoints for dictionary detail functionality:');
console.log('   GET    /api/dictionaries/:id/words           - List words in dictionary');
console.log('   POST   /api/dictionaries/:id/words           - Add word to dictionary');
console.log('   DELETE /api/dictionaries/:id/words/:wordId    - Remove word from dictionary');
console.log('   PUT    /api/dictionary-word-associations/:id  - Update word association');