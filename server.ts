import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tflow.db");
const JWT_SECRET = process.env.JWT_SECRET || "tflow-secret-key-1337";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
  );
`);

const app = express();
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

const TEMP_MAIL_DOMAINS = [
  "tempmail.com", "throwawaymail.com", "guerrillamail.com", "sharklasers.com", 
  "mailinator.com", "yopmail.com", "dispostable.com", "10minutemail.com"
];

app.post("/api/auth/register", async (req, res) => {
  const { pseudo, email, password } = req.body;

  if (!pseudo || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires." });
  }

  // Check temp mail
  const domain = email.split("@")[1];
  if (TEMP_MAIL_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: "Les emails temporaires sont interdits." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (pseudo, email, password) VALUES (?, ?, ?)");
    const info = stmt.run(pseudo, email, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, pseudo, email, role: 'user' }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, pseudo, email, role: 'user' } });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed: users.pseudo")) {
      return res.status(400).json({ error: "Ce pseudo est déjà utilisé." });
    }
    if (err.message.includes("UNIQUE constraint failed: users.email")) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Email ou mot de passe incorrect." });
  }

  const token = jwt.sign({ id: user.id, pseudo: user.pseudo, email: user.email, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, pseudo: user.pseudo, email: user.email, role: user.role } });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user: any = db.prepare("SELECT id, pseudo, email, role FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

// --- User Routes ---

app.post("/api/user/vip-activate", authenticateToken, (req: any, res) => {
  const { key } = req.body;
  const VIP_KEY = "nononono1337";

  if (key !== VIP_KEY) {
    return res.status(400).json({ error: "Clé VIP incorrecte." });
  }

  // Check if someone is already VIP
  const existingVip = db.prepare("SELECT * FROM users WHERE role = 'vip' OR role = 'creator'").get();
  if (existingVip && existingVip.id !== req.user.id) {
    return res.status(400).json({ error: "Une seule personne peut être VIP à la fois." });
  }

  const user: any = db.prepare("SELECT pseudo FROM users WHERE id = ?").get(req.user.id);
  const isCreator = user.pseudo === "Abdelmalek Bouneb";
  const newRole = isCreator ? 'creator' : 'vip';

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(newRole, req.user.id);
  res.json({ success: true, role: newRole });
});

app.post("/api/user/update", authenticateToken, async (req: any, res) => {
  const { pseudo, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

  if (pseudo && pseudo !== user.pseudo) {
    try {
      db.prepare("UPDATE users SET pseudo = ? WHERE id = ?").run(pseudo, req.user.id);
    } catch (err) {
      return res.status(400).json({ error: "Ce pseudo est déjà utilisé." });
    }
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
  }

  res.json({ success: true });
});

app.delete("/api/user", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  res.json({ success: true });
});

// --- Chat Routes ---

app.get("/api/conversations", authenticateToken, (req: any, res) => {
  const convs = db.prepare("SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(convs);
});

app.post("/api/conversations", authenticateToken, (req: any, res) => {
  const { id, title } = req.body;
  db.prepare("INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)").run(id, req.user.id, title);
  res.json({ success: true });
});

app.delete("/api/conversations/:id", authenticateToken, (req: any, res) => {
  db.prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get("/api/conversations/:id/messages", authenticateToken, (req: any, res) => {
  const messages = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json(messages);
});

app.post("/api/conversations/:id/messages", authenticateToken, (req: any, res) => {
  const { role, content } = req.body;
  db.prepare("INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)").run(req.params.id, role, content);
  res.json({ success: true });
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
