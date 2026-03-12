import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, pseudo, email, role')
      .eq('id', authUser.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur." });
  }
}
