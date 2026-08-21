import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

async function validateKey() {
  try {
    console.log('Testing OpenAI API Key...');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.models.list();
    if (response.data && response.data.length > 0) {
      console.log('✅ Validation successful! The API key is working perfectly.');
      console.log('Available Models:', response.data.map(m => m.id).slice(0, 5));
    } else {
      console.log('❌ Validation failed! Unexpected response from OpenAI.');
    }
  } catch (error) {
    console.error('❌ Validation failed! Error details:');
    console.error(error.message || error);
  }
}

validateKey();
