import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function validateKey() {
  try {
    console.log('Testing Google Gemini API Key...');
    const { text } = await generateText({
      model: google('gemini-3.5-flash'),
      prompt: 'Respond with exactly one word: "SUCCESS"',
    });
    
    if (text.trim() === 'SUCCESS') {
      console.log('✅ Validation successful! The API key is working perfectly.');
    } else {
      console.log('⚠️ Validation returned an unexpected response:', text);
    }
  } catch (error) {
    console.error('❌ Validation failed! Error details:');
    console.error(error.message);
  }
}

validateKey();
