const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const CLERK_TOKEN = 'YOUR_CLERK_TOKEN_HERE'; // Replace with your actual token
const TEST_FOLLOWING_ID = 'user_test123'; // Replace with a real user ID

// Test data
const testUsers = [
    'user_2abc123def456',
    'user_3def456ghi789',
    'user_4ghi789jkl012'
];

async function testFollowEndpoints() {
    console.log('🚀 Testing Follow Endpoints...\n');

    // Test 1: Follow a user
    console.log('1️⃣ Testing POST /api/follow (Follow User)');
    try {
        const followResponse = await fetch(`${BASE_URL}/follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CLERK_TOKEN}`
            },
            body: JSON.stringify({
                following_id: TEST_FOLLOWING_ID
            })
        });

        const followData = await followResponse.json();
        console.log('Status:', followResponse.status);
        console.log('Response:', JSON.stringify(followData, null, 2));
        console.log('✅ Follow test completed\n');
    } catch (error) {
        console.error('❌ Follow test failed:', error.message);
    }

    // Test 2: Get following list
    console.log('2️⃣ Testing GET /api/follow (Get Following List)');
    try {
        const followingResponse = await fetch(`${BASE_URL}/follow?limit=10&offset=0`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CLERK_TOKEN}`
            }
        });

        const followingData = await followingResponse.json();
        console.log('Status:', followingResponse.status);
        console.log('Response:', JSON.stringify(followingData, null, 2));
        console.log('✅ Get following test completed\n');
    } catch (error) {
        console.error('❌ Get following test failed:', error.message);
    }

    // Test 3: Test error cases
    console.log('3️⃣ Testing Error Cases');

    // Test without token
    try {
        const noTokenResponse = await fetch(`${BASE_URL}/follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                following_id: TEST_FOLLOWING_ID
            })
        });
        console.log('No token test - Status:', noTokenResponse.status);
    } catch (error) {
        console.error('No token test failed:', error.message);
    }

    // Test with invalid following_id
    try {
        const invalidIdResponse = await fetch(`${BASE_URL}/follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CLERK_TOKEN}`
            },
            body: JSON.stringify({
                following_id: '' // Invalid empty ID
            })
        });
        console.log('Invalid ID test - Status:', invalidIdResponse.status);
    } catch (error) {
        console.error('Invalid ID test failed:', error.message);
    }

    console.log('✅ Error case tests completed\n');
}

// Instructions
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Make sure your server is running: npm run dev');
console.log('2. Replace CLERK_TOKEN with your actual Clerk session token');
console.log('3. Replace TEST_FOLLOWING_ID with a real user ID to follow');
console.log('4. Run this script: node test-follow-endpoints.js\n');

// Run tests if token is provided
if (CLERK_TOKEN !== 'YOUR_CLERK_TOKEN_HERE') {
    testFollowEndpoints();
} else {
    console.log('⚠️  Please update the CLERK_TOKEN variable with your actual token before running tests.');
} 