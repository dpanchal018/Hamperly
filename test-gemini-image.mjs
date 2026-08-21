import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

async function testGeminiImage() {
  try {
    console.log('Testing Gemini Image Generation...');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    
    const prompt = "A beautiful red apple on a wooden table.";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1 }
      })
    });
    
    const data = await response.json();
    if (data.predictions && data.predictions.length > 0) {
      console.log('✅ Success! Found predictions.');
      // The image is usually base64 encoded in bytesBase64
      const base64 = data.predictions[0].bytesBase64;
      console.log('Image starts with:', base64?.substring(0, 50));
    } else {
      console.log('❌ Failed. Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Failed! Error details:', error.message || error);
  }
}

testGeminiImage();
