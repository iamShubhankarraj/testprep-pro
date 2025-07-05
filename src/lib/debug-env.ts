import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log('🔍 Environment Debug Script');
console.log('📁 Current working directory:', process.cwd());

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
console.log('📄 .env.local path:', envPath);
console.log('📄 .env.local exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 .env.local content:');
  console.log(envContent);
  console.log('📄 File length:', envContent.length);
}

// Try to load environment variables
console.log('\n🔄 Loading environment variables...');
const result = config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
} else {
  console.log('✅ Environment variables loaded successfully');
}

// Check what's in process.env
console.log('\n🔑 Environment variables check:');
console.log('GOOGLE_VISION_API_KEY exists:', !!process.env.GOOGLE_VISION_API_KEY);
console.log('GOOGLE_GEMINI_API_KEY exists:', !!process.env.GOOGLE_GEMINI_API_KEY);

if (process.env.GOOGLE_VISION_API_KEY) {
  console.log('GOOGLE_VISION_API_KEY starts with:', process.env.GOOGLE_VISION_API_KEY.substring(0, 10) + '...');
}

if (process.env.GOOGLE_GEMINI_API_KEY) {
  console.log('GOOGLE_GEMINI_API_KEY starts with:', process.env.GOOGLE_GEMINI_API_KEY.substring(0, 10) + '...');
}

// List all environment variables that contain 'GOOGLE'
const googleEnvVars = Object.keys(process.env).filter(key => key.includes('GOOGLE'));
console.log('\n🔍 All GOOGLE environment variables:', googleEnvVars);