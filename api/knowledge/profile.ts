import fs from 'fs';
import path from 'path';

export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const profilePath = path.join(process.cwd(), 'public', 'ai', 'profile.json');
    if (fs.existsSync(profilePath)) {
      const content = fs.readFileSync(profilePath, 'utf8');
      return res.status(200).send(content);
    }
    return res.status(404).json({ error: 'Profile not found' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to read profile' });
  }
}
