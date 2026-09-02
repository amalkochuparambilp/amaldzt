// Universal Vercel Function for /api/contact (supports both Node.js req/res and Web Request/Response)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8698327116:AAElplFCAnxuyC0gVORQEAll8qP70btDwUk';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7814866194';

export default async function handler(req: any, res?: any) {
  // Check if running in Web Standard / Edge Runtime (Request object without Express res)
  if (req instanceof Request || (!res && typeof (req as any)?.headers?.get === 'function')) {
    const request = req as Request;
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify({ configured: Boolean(BOT_TOKEN && CHAT_ID), service: 'telegram' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const { name, email, message, _hp } = body;

      if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
        return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (typeof name !== 'string' || !name.trim() || name.trim().length < 2) {
        return new Response(JSON.stringify({ success: false, error: 'Please enter a valid name (min 2 characters).' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return new Response(JSON.stringify({ success: false, error: 'Please provide a valid email address.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (typeof message !== 'string' || message.trim().length < 5) {
        return new Response(JSON.stringify({ success: false, error: 'Message must be at least 5 characters long.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const formatted = [
        '📩 New Contact Form Submission',
        '',
        `👤 Name: ${name.trim()}`,
        `📧 Email: ${email.trim()}`,
        `💬 Message: ${message.trim()}`
      ].join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: formatted, disable_web_page_preview: true })
      });

      const tgData = await tgRes.json().catch(() => ({}));
      if (!tgRes.ok || !tgData.ok) {
        return new Response(JSON.stringify({ success: false, error: tgData.description || 'Telegram gateway error.' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Message sent successfully!' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || 'Internal error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Node.js Serverless Function Runtime (req, res)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ configured: Boolean(BOT_TOKEN && CHAT_ID), service: 'telegram' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { name, email, message, _hp } = body;

    // Honeypot check
    if (_hp && typeof _hp === 'string' && _hp.trim().length > 0) {
      return res.status(200).json({ success: true, message: 'Message sent successfully!' });
    }

    if (typeof name !== 'string' || !name.trim() || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter a valid name (min 2 characters).' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Message must be at least 5 characters long.' });
    }

    const formattedTelegramMessage = [
      '📩 New Contact Form Submission',
      '',
      `👤 Name: ${name.trim()}`,
      `📧 Email: ${email.trim()}`,
      `💬 Message: ${message.trim()}`
    ].join('\n');

    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: formattedTelegramMessage,
        disable_web_page_preview: true
      })
    });

    const tgData = (await tgResponse.json()) as { ok: boolean; description?: string };
    if (!tgResponse.ok || !tgData.ok) {
      const errorMsg = tgData.description || 'Unable to deliver message to Telegram.';
      return res.status(502).json({ success: false, error: `Telegram delivery failed: ${errorMsg}` });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('API Contact error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error occurred.' });
  }
}
