import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

async function testDalle() {
  try {
    console.log('Testing DALL-E 3 Image Generation...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: "A beautiful red apple on a wooden table.",
      n: 1,
      size: "1024x1024",
    });

    console.log('✅ Success! Image URL:', response.data[0].url);
  } catch (error) {
    console.error('❌ Failed! Error details:', error.message || error);
  }
}

testDalle();
