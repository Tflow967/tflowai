import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || "tflow-secret-key-1337";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign({ id: user.id, pseudo: user.pseudo, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, pseudo: user.pseudo, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
}
