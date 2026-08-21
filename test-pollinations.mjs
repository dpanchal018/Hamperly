async function testPollinations() {
  try {
    const prompt = "A beautiful luxury gifting hamper containing wine and chocolates, photorealistic, 8k";
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    
    console.log("Testing Pollinations.ai with URL:", url);
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`✅ Success! Response status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Image URL to use: ${url}`);
    } else {
      console.log(`❌ Failed. Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPollinations();
