import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { paths } from '../routes';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const register = useRegister();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    register.mutate(
      { email, password, displayName: displayName || undefined },
      { onSuccess: () => { void navigate(paths.onboarding, { replace: true, state: { from: paths.register } }); } },
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
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-k-fg">Create account</h1>
          <p className="mt-2 text-sm text-k-muted">Start building your personalized program</p>
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
              <Label>Display Name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {register.isError && (
              <p className="text-sm text-k-error">Registration failed. Try a different email.</p>
            )}
            <Button type="submit" variant="primary" size="md" disabled={register.isPending} className="w-full">
              {register.isPending ? 'Creating…' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-k-muted">
              Already have an account?{' '}
              <Link to={paths.login} className="text-k-brand hover:underline">
                Log In
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
