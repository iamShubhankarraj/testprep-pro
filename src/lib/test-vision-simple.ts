import fs from 'fs';
import path from 'path';

const testGoogleVisionSimple = async () => {
  try {
    console.log('🚀 Simple Google Vision API test...');
    
    // Manually read the .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse the environment variables manually
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    console.log('📄 Parsed environment variables:');
    Object.keys(envVars).forEach(key => {
      if (key.includes('GOOGLE')) {
        console.log(`${key}: ${envVars[key].substring(0, 10)}...`);
      }
    });
    
    const apiKey = envVars['GOOGLE_VISION_API_KEY'];
    
    if (!apiKey) {
      console.error('❌ GOOGLE_VISION_API_KEY not found in .env.local');
      return false;
    }

    console.log('✅ API Key found, testing connection...');

    // Test the API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              source: {
                imageUri: 'https://cloud.google.com/vision/docs/images/sign_text.png'
              }
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 10
              }
            ]
          }
        ]
      })
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return false;
    }

    const data = await response.json();

    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      const detectedText = data.responses[0].textAnnotations[0].description;
      console.log('✅ SUCCESS! Google Vision API is working!');
      console.log('📝 Detected text:');
      console.log(detectedText);
      return true;
    } else {
      console.log('⚠️ No text detected');
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return false;
  }
};

testGoogleVisionSimple().then(success => {
  if (success) {
    console.log('\n🎉 READY TO BUILD PDF PROCESSOR!');
  } else {
    console.log('\n🔧 API test failed');
  }
});