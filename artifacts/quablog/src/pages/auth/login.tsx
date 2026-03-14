import { useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { ArrowRight, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login: setAuthContext } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@quablog.com', password: 'admin123' } // Demo defaults
  });

  const loginMutation = useLogin();

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
      const res = await loginMutation.mutateAsync({ data });
      setAuthContext(res.token);
      window.location.href = '/';
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-3xl shadow-xl border border-border relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-accent" />
        
        <div>
          <h2 className="text-center text-3xl font-display font-extrabold text-foreground">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/signup" className="font-semibold text-primary hover:text-primary/80">Sign up</Link>
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
              <input 
                {...register('email')}
                type="email" 
                className={`input-field ${errors.email ? 'border-destructive focus:ring-destructive/10' : ''}`} 
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input 
                {...register('password')}
                type="password" 
                className={`input-field ${errors.password ? 'border-destructive focus:ring-destructive/10' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loginMutation.isPending}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-lg"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
