import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  console.log("Using API Key starting with:", apiKey.substring(0, 10));
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent("Hello! What model are you?");
    console.log("Success! Response:", result.response.text());
  } catch (error: any) {
    console.error("generateContent failed:", error?.message || error);
  }
}

testGemini();
