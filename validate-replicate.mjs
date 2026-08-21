import * as dotenv from 'dotenv';
import Replicate from 'replicate';

dotenv.config({ path: '.env.local' });

async function validateKey() {
  try {
    console.log('Testing Replicate API Token...');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Check account information or just run a very simple fast model to test auth
    // Running a tiny prompt through flux-schnell to verify it has permissions/credits
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: "A simple red apple",
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 50,
          num_outputs: 1
        }
      }
    );

    if (output && output.length > 0) {
      console.log('✅ Validation successful! The Replicate token is working perfectly.');
      console.log('Sample generation URL:', output[0]);
    } else {
      console.log('❌ Validation failed! Unexpected response.');
    }
  } catch (error) {
    console.error('❌ Validation failed! Error details:');
    console.error(error.message || error);
  }
}

validateKey();
