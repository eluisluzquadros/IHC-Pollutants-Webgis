const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usaremos a chave secreta das variáveis de ambiente, ou um fallback para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 'webgis_super_secret_key_2025';

// Fallback in-memory para usuários se o PostgreSQL não estiver configurado
let inMemoryUsers = [];

function setupAuthRoutes(app, db, users) {
  const router = express.Router();

  // Middleware para verificar o token JWT nas rotas protegidas
  const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  };

  // Rota: Registrar
  router.post('/register', async (req, res) => {
    try {
      const { email, password, displayName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Verificar se usuário existe
      let existingUser;
      if (db && users) {
        const { eq } = require('drizzle-orm');
        existingUser = await db.select().from(users).where(eq(users.email, email));
      } else {
        existingUser = inMemoryUsers.filter(u => u.email === email);
      }
      
      if (existingUser && existingUser.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      let newUser;
      // Inserir usuário
      if (db && users) {
        newUser = await db.insert(users).values({
          email,
          passwordHash,
          displayName: displayName || email.split('@')[0],
          role: 'user'
        }).returning();
        newUser = newUser[0];
      } else {
        newUser = {
          id: String(Date.now()),
          email,
          passwordHash,
          displayName: displayName || email.split('@')[0],
          role: 'user',
          createdAt: new Date()
        };
        inMemoryUsers.push(newUser);
      }

      // Gerar Token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Erro interno ao registrar usuário' });
    }
  });

  // Rota: Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      let userResult;
      if (db && users) {
        const { eq } = require('drizzle-orm');
        userResult = await db.select().from(users).where(eq(users.email, email));
      } else {
        userResult = inMemoryUsers.filter(u => u.email === email);
      }
      
      if (!userResult || userResult.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const user = userResult[0];

      // Validar senha
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro interno ao realizar login' });
    }
  });

  // Rota: Dados do usuário atual (Me)
  router.get('/me', verifyToken, async (req, res) => {
    try {
      let userResult;
      if (db && users) {
        const { eq } = require('drizzle-orm');
        userResult = await db.select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt
        }).from(users).where(eq(users.id, req.user.id));
      } else {
        const inMemUser = inMemoryUsers.find(u => u.id === req.user.id);
        userResult = inMemUser ? [inMemUser] : [];
      }

      if (!userResult || userResult.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ success: true, user: userResult[0] });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Erro interno ao buscar usuário' });
    }
  });

  app.use('/api/auth', router);
  
  return { verifyToken };
}

module.exports = { setupAuthRoutes, JWT_SECRET };
