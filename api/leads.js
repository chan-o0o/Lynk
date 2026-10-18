const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254);

    if (!EMAIL_PATTERN.test(email) || body?.consent !== true) {
      return response.status(400).json({ ok: false, error: 'Invalid submission' });
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !secretKey) {
      throw new Error('Supabase environment variables are missing');
    }

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ email })
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase insert failed: ${supabaseResponse.status}`);
    }

    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('Lead submission failed:', error.message);
    return response.status(500).json({ ok: false, error: 'Unable to save lead' });
  }
};
