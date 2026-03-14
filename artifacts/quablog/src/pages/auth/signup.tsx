import { useState } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { ArrowRight, AlertCircle } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 chars').max(30),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 chars')
});
type SignupForm = z.infer<typeof signupSchema>;

export function Signup() {
  const { login: setAuthContext } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  const registerMutation = useRegister();

  const onSubmit = async (data: SignupForm) => {
    setErrorMsg('');
    try {
      const res = await registerMutation.mutateAsync({ data });
      setAuthContext(res.token);
      window.location.href = '/';
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-3xl shadow-xl border border-border relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-accent to-primary" />
        
        <div>
          <h2 className="text-center text-3xl font-display font-extrabold text-foreground">Join Quablog</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="font-semibold text-primary hover:text-primary/80">Log in</Link>
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input 
              {...register('displayName')}
              className={`input-field ${errors.displayName ? 'border-destructive' : ''}`} 
              placeholder="Jane Doe"
            />
            {errors.displayName && <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input 
              {...register('username')}
              className={`input-field ${errors.username ? 'border-destructive' : ''}`} 
              placeholder="janedoe"
            />
            {errors.username && <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email address</label>
            <input 
              {...register('email')}
              type="email" 
              className={`input-field ${errors.email ? 'border-destructive' : ''}`} 
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input 
              {...register('password')}
              type="password" 
              className={`input-field ${errors.password ? 'border-destructive' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-lg mt-2"
          >
            {registerMutation.isPending ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
