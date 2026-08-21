import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.models) {
    console.log('Available models:');
    data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => {
      console.log(m.name);
    });
  } else {
    console.log('Error fetching models:', data);
  }
}

listModels();
