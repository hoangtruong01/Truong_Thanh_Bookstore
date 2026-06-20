const MONGODB_URI = 'mongodb+srv://...'; // Ignore db

const apiKey = 'AQ.Ab8RN6JHOB5z3rms5bFRzb5TG5rE22-_PsH7sHzkM6PtZqmrg';

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
  
  console.log('Testing with x-goog-api-key header...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: 'Hello, respond with exactly "Key works!"' }] }
        ]
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }

  console.log('\nTesting with query parameter...');
  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: 'Hello, respond with exactly "Key works!"' }] }
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

run();
