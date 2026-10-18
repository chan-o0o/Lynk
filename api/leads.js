const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPABASE_URL = 'https://xuhmjhbjfhyhmkdihxtj.supabase.co';
const JOB_ROLES = new Set(['대표/창업자', '기획/PM', '마케팅/브랜드', '영업/BD', '디자인', '개발/데이터', '운영/경영지원', '기타']);

module.exports = async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254);
    const jobRole = String(body?.jobRole ?? '').trim().slice(0, 50);

    if (!EMAIL_PATTERN.test(email) || !JOB_ROLES.has(jobRole) || body?.consent !== true) {
      return response.status(400).json({ ok: false, error: 'Invalid submission' });
    }

    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('SUPABASE_SECRET_KEY is missing');
    }

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ email, job_role: jobRole })
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
