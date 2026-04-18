export default async function handler(req, res) {
  // CORS Headers for safety (though mostly accessed from same domain)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, forceText } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt data' });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing' });
  }

  const systemMsg = forceText 
    ? "You are an expert career coach. Output ONLY plain text, no markdown formatting."
    : "You are a professional resume writer. Always respond with ONLY valid JSON, no markdown, no explanation.";

  try {
    const nvidiaReq = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-397b-a17b',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2048,
        stream: false
      })
    });

    if (!nvidiaReq.ok) {
      const err = await nvidiaReq.json();
      return res.status(nvidiaReq.status).json({ error: err || 'NVIDIA API Error' });
    }

    const data = await nvidiaReq.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
