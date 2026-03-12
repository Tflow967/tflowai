import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || "tflow-secret-key-1337";
const TEMP_MAIL_DOMAINS = [
  "tempmail.com", "throwawaymail.com", "guerrillamail.com", "sharklasers.com", 
  "mailinator.com", "yopmail.com", "dispostable.com", "10minutemail.com"
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pseudo, email, password } = req.body;

  if (!pseudo || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires." });
  }

  const domain = email.split("@")[1];
  if (TEMP_MAIL_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Les emails temporaires sont interdits." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ pseudo, email, password: hashedPassword }])
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate key value violates unique constraint")) {
        if (error.message.includes("users_pseudo_key")) {
          return res.status(400).json({ error: "Ce pseudo est déjà utilisé." });
        }
        if (error.message.includes("users_email_key")) {
          return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }
      }
      throw error;
    }

    const user = data;
    const token = jwt.sign({ id: user.id, pseudo: user.pseudo, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ token, user: { id: user.id, pseudo: user.pseudo, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
}
