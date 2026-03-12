export interface User {
  id: number;
  pseudo: string;
  email: string;
  role: 'user' | 'vip' | 'creator';
}

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}
