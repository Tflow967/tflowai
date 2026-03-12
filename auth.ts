import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', authUser.id);

      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la suppression de la conversation." });
    }
  }

  res.status(405).end();
}
