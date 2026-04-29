import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Login realizado com sucesso!');
      } else {
        await register(email, password, displayName);
        toast.success('Conta criada com sucesso!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-landing-navy text-landing-navy dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-center">
            {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLogin 
              ? 'Entre com suas credenciais para acessar a Envibase.' 
              : 'Preencha os dados abaixo para começar a usar a plataforma.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-landing-primary hover:bg-landing-primary/90 text-white" 
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Registrar')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <p>
            {isLogin ? "Não tem uma conta?" : "Já possui uma conta?"}{' '}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-landing-primary hover:underline font-medium"
            >
              {isLogin ? 'Criar agora' : 'Faça login'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
