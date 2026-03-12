import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  if (req.method === 'GET') {
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(convs);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la récupération des conversations." });
    }
  }

  if (req.method === 'POST') {
    const { id, title } = req.body;
    try {
      const { error } = await supabase
        .from('conversations')
        .insert([{ id, user_id: authUser.id, title }]);

      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la création de la conversation." });
    }
  }

  res.status(405).end();
}
