import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { AuthIntro } from './AuthIntro';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [searchParams] = useSearchParams();
  const skipIntro = searchParams.get("intro") === "false";
  const [showIntro, setShowIntro] = useState(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    return isMobile && !skipIntro;
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  if (showIntro) {
    return (
      <AuthIntro
        onLogin={() => navigate("/login?intro=false")}
        onRegister={() => setShowIntro(false)}
      />
    );
  }

  const password = watch('password', '');

  const onSubmit = async (data: RegisterValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Registration successful! Please check your email for verification.');
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        
        {/* Left Side: Introduction */}
        <div className="hidden md:flex flex-col space-y-6 text-center items-center p-6">
          <style>{`
            @keyframes slideUp {
              0% { opacity: 0; transform: translateY(8px); }
              100% { opacity: 1; transform: translateY(0px); }
            }
            .animate-slide-up {
              animation: slideUp 0.5s ease-out forwards;
            }
          `}</style>
          {/* Logo (Icon + Text in 1 line, Centered and Bigger) */}
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              Eous
            </h1>
            <img src="/app_icon.svg" alt="Eous Logo" className="h-16 w-16" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your AI Study Mentor</h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Master any subject with step-by-step explanations, personalized quizzes, and instant homework help.
            </p>
          </div>

          <div className="space-y-4 mt-6 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base">AI-Powered Solutions</h3>
                <p className="text-sm text-muted-foreground">Get instant help with complex equations, diagrams, and text questions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Tailored to Your Level</h3>
                <p className="text-sm text-muted-foreground">Explanations adapt to your education level (Middle School, High School, or University).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor your learning journey with detailed analytics and gamified rewards.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <Card className="relative border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-purple-500/5 animate-slide-up">
          {/* Absolute Circled Back Button for Mobile */}
          <button 
            type="button" 
            onClick={() => setShowIntro(true)} 
            className="md:hidden absolute top-4 left-4 z-20 w-8 h-8 bg-background/80 hover:bg-background border border-border/40 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-all shadow-md active:scale-95"
            title="Back to onboarding"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <CardHeader className="space-y-1 mt-4">
            <div className="md:hidden flex justify-center mb-4">
              <img src="/app_icon.svg" alt="Eous Logo" className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Create an Account</CardTitle>
            <CardDescription className="text-center text-base">
              Start your journey with Eous AI Study Mentor
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-4 pb-8">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all"
                  {...register('email')} 
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all pr-10 [&::-ms-reveal]:hidden"
                    {...register('password')} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                <PasswordStrengthMeter password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all pr-10 [&::-ms-reveal]:hidden"
                    {...register('confirmPassword')} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button 
                type="submit" 
                className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] text-base font-semibold" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
              <p className="text-sm text-center text-muted-foreground pt-2">
                Already have an account?{' '}
                <Link to="/login?intro=false" className="text-primary font-medium hover:text-purple-600 transition-colors">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
