#!/usr/bin/env node

/**
 * Check ImageKit configuration and connectivity
 */

require('dotenv').config();
const { imagekit } = require('../utils/imagekit');

console.log('🔍 Checking ImageKit configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'IMAGEKIT_URL_ENDPOINT',
  'IMAGEKIT_PUBLIC_KEY', 
  'IMAGEKIT_PRIVATE_KEY'
];

let envOk = true;
console.log('📋 Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Not set`);
    envOk = false;
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('PRIVATE') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

if (!envOk) {
  console.log('\n❌ Some required environment variables are missing.');
  console.log('Please check your .env file and ensure all ImageKit variables are set.');
  process.exit(1);
}

console.log('\n🔌 Testing ImageKit connection...');

// Test ImageKit connection
async function testImageKitConnection() {
  try {
    // Test by listing files (this will fail if credentials are wrong)
    const result = await imagekit.listFiles({
      skip: 0,
      limit: 1
    });
    
    console.log('✅ ImageKit connection successful!');
    console.log(`📁 Found ${result.length} files in your account`);
    
    // Test authentication parameters
    const authParams = imagekit.getAuthenticationParameters();
    console.log('✅ Authentication parameters generated successfully');
    console.log(`🔑 Token expires: ${new Date(authParams.expire * 1000).toLocaleString()}`);
    
  } catch (error) {
    console.log('❌ ImageKit connection failed:');
    console.log('   Error:', error.message);
    
    if (error.message.includes('authentication') || error.message.includes('credentials')) {
      console.log('\n💡 Possible solutions:');
      console.log('   - Check if your ImageKit keys are correct');
      console.log('   - Ensure your ImageKit account is active');
      console.log('   - Verify the URL endpoint is correct');
    }
    
    process.exit(1);
  }
}

// Test upload functionality
async function testUpload() {
  console.log('\n📤 Testing upload functionality...');
  
  try {
    // Create a simple test buffer
    const testBuffer = Buffer.from('Test file for ImageKit upload');
    const fileName = `test-${Date.now()}.txt`;
    
    const result = await imagekit.upload({
      file: testBuffer,
      fileName: fileName,
      folder: 'test-uploads'
    });
    
    console.log('✅ Test upload successful!');
    console.log(`📁 File uploaded: ${result.name}`);
    console.log(`🔗 URL: ${result.url}`);
    
    // Clean up - delete the test file
    await imagekit.deleteFile(result.fileId);
    console.log('🗑️  Test file deleted successfully');
    
  } catch (error) {
    console.log('❌ Test upload failed:');
    console.log('   Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  await testImageKitConnection();
  await testUpload();
  
  console.log('\n🎉 All ImageKit tests passed!');
  console.log('✨ Your ImageKit integration is ready to use.');
}

main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
