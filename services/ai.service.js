const axios = require('axios');

// AI service using OpenAI API
async function generateText(prompt, opts = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const payload = {
    model: opts.model || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: opts.maxTokens || 150,
    temperature: opts.temperature || 0.7,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Error generating text', err.response?.data || err.message);
    throw new Error('Failed to generate text');
  }
}

// Generate embeddings
async function generateEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/embeddings';

  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const payload = {
    model: 'text-embedding-ada-002',
    input: text,
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data[0].embedding;
  } catch (err) {
    console.error('Error generating embedding', err.response?.data || err.message);
    throw new Error('Failed to generate embedding');
  }
}

module.exports = {
  generateText,
  generateEmbedding,
};