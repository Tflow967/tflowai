import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || "tflow-secret-key-1337";

export interface AuthUser {
  id: number;
  pseudo: string;
  email: string;
  role: string;
}

export const authenticateToken = (req: VercelRequest, res: VercelResponse): AuthUser | null => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    return user;
  } catch (err) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
};
