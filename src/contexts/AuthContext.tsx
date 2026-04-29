import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: any;
  ownerId: string;
  settings?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  createProject: (name: string, description: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          await loadProjects(token);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadProjects = async (token: string) => {
    try {
      const response = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setActiveProject(data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Resposta do servidor não é um JSON válido: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao realizar login');
    }

    localStorage.setItem('token', data.token);
    setUser(data.user);
    await loadProjects(data.token);
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Resposta do servidor não é um JSON válido: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao registrar usuário');
    }

    localStorage.setItem('token', data.token);
    setUser(data.user);
    await loadProjects(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProjects([]);
    setActiveProject(null);
  };

  const createProject = async (name: string, description: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });

    if (response.ok) {
      const data = await response.json();
      setProjects(prev => [...prev, data.project]);
      setActiveProject(data.project);
    } else {
      throw new Error('Falha ao criar projeto');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      projects,
      activeProject,
      setActiveProject,
      login,
      register,
      logout,
      createProject
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
