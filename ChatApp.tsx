import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', authUser.id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors de la suppression." });
  }
}
