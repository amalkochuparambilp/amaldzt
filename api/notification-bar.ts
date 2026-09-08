import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  // Web Standard / Edge runtime
  if (req instanceof Request || (!res && typeof (req as any)?.headers?.get === 'function')) {
    if ((req as Request).method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const barPath = path.join(process.cwd(), 'public', 'notification-bar.json');
      if (fs.existsSync(barPath)) {
        const raw = fs.readFileSync(barPath, 'utf8');
        const data = JSON.parse(raw);
        return new Response(JSON.stringify({ success: true, active: Boolean(data?.active), notification: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ success: true, active: false, notification: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, active: false, error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // Node.js runtime
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const barPath = path.join(process.cwd(), 'public', 'notification-bar.json');
    if (fs.existsSync(barPath)) {
      const raw = fs.readFileSync(barPath, 'utf8');
      const data = JSON.parse(raw);
      return res.status(200).json({ success: true, active: Boolean(data?.active), notification: data });
    }
    return res.status(200).json({ success: true, active: false, notification: null });
  } catch (e: any) {
    return res.status(500).json({ success: false, active: false, error: e.message });
  }
}
