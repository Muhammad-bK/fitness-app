import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { paths } from '../routes';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => { void navigate(paths.home, { replace: true }); } },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-k-bg px-6 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-xs font-bold tracking-[0.18em] uppercase text-k-fg">
            Zeeshan app
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-k-fg">Welcome back</h1>
          <p className="mt-2 text-sm text-k-muted">Sign in to continue your training</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {login.isError && (
              <p className="text-sm text-k-error">Invalid email or password.</p>
            )}
            <Button type="submit" variant="primary" size="md" disabled={login.isPending} className="w-full">
              {login.isPending ? 'Logging in…' : 'Log In'}
            </Button>
            <p className="text-sm text-center text-k-muted">
              Don&apos;t have an account?{' '}
              <Link to={paths.register} className="text-k-brand hover:underline">
                Register
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
