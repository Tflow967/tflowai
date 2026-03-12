import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  const { id: conversation_id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.json(messages);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de la récupération des messages." });
    }
  }

  if (req.method === 'POST') {
    const { role, content } = req.body;
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ conversation_id, role, content }]);

      if (error) throw error;
      return res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de l'envoi du message." });
    }
  }

  res.status(405).end();
}
