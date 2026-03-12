import { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateToken } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const authUser = authenticateToken(req, res);
  if (!authUser) return;

  const { key } = req.body;
  const VIP_KEY = "nononono1337";

  if (key !== VIP_KEY) {
    return res.status(400).json({ error: "Clé VIP incorrecte." });
  }

  try {
    // Check if someone is already VIP
    const { data: existingVip, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or('role.eq.vip,role.eq.creator')
      .neq('id', authUser.id)
      .maybeSingle();

    if (existingVip) {
      return res.status(400).json({ error: "Une seule personne peut être VIP à la fois." });
    }

    const isCreator = authUser.pseudo === "Abdelmalek Bouneb";
    const newRole = isCreator ? 'creator' : 'vip';

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', authUser.id);

    if (updateError) throw updateError;
    res.json({ success: true, role: newRole });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'activation VIP." });
  }
}
