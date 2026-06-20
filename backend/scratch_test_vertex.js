const apiKey = 'AQ.Ab8RN6JHOB5z3rms5bFRzb5TG5rE22-_PsH7sHzkM6PtZqmrg';
const projectNumber = '151331619888';

async function run() {
  const regions = ['us-central1', 'asia-southeast1'];
  
  for (const region of regions) {
    const url = `https://${region}-aiplatform.googleapis.com/v1beta1/projects/${projectNumber}/locations/${region}/publishers/google/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`;
    
    console.log(`\nTesting Vertex AI in region ${region}...`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: 'Hello' }] }
          ]
        })
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

run();
