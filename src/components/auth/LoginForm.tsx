import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<
    LoginValues
  >({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    if (mfaRequired) {
      onVerifyMfa();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Check if MFA is required
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
        setMfaRequired(true);
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors && factors.totp.length > 0) {
          setMfaFactorId(factors.totp[0].id);
        }
        toast.info("Please enter your 2FA code");
        return;
      }

      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyMfa = async () => {
    if (!mfaFactorId || !mfaCode) return;
    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      } as any);
      if (verifyError) throw verifyError;
      
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("MFA verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full items-center">
        {/* Left Side: Introduction */}
        <div className="hidden md:flex flex-col space-y-8 text-left items-start p-6">
          {/* Capsule Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-purple-600 shadow-sm">
            <span>🚀 Eous — The #1 AI Study Mentor</span>
          </div>

          {/* Massive Title */}
          <div className="space-y-2">
            <style>
              {`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
              }
              @keyframes shimmer {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-float {
                animation: float 4s ease-in-out infinite;
              }
              .animate-shimmer {
                background-size: 200% auto;
                animation: shimmer 4s linear infinite;
              }
              @keyframes slideUp {
                0% { opacity: 0; transform: translateY(8px); }
                100% { opacity: 1; transform: translateY(0px); }
              }
              .animate-slide-up {
                animation: slideUp 0.5s ease-out forwards;
              }
            `}
            </style>
            <div className="flex items-center justify-center gap-2">
              <div className="text-left">
                <h1 className="text-4xl font-black tracking-tight text-foreground whitespace-nowrap">
                  Your AI Mentor
                </h1>
                <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 animate-shimmer whitespace-nowrap">
                  Ready for You.
                </h1>
              </div>
              {/* Clean Flat Mascot */}
              <img
                src="/app_icon.svg"
                alt="Eous Mascot"
                className="h-20 w-20 animate-float flex-shrink-0"
              />
            </div>
          </div>

          {/* Subtitle with bold parts */}
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            A personal study assistant everyone's obsessed with —{" "}
            <span className="text-foreground font-bold">works 24/7</span>, no
            setup needed. Master any subject with{" "}
            <span className="text-foreground font-bold">
              step-by-step explanations
            </span>.
          </p>

          {/* Extra clean visual items */}
          <div className="mt-4 flex flex-wrap gap-4">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />{" "}
              No credit card needed
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />{" "}
              Cancel anytime
            </span>
          </div>
        </div>

        {/* Right Side: Form */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-purple-500/5 animate-slide-up">
          <CardHeader className="space-y-1 mt-4">
            <div className="md:hidden flex justify-center mb-4">
              <img src="/app_icon.svg" alt="Eous Logo" className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-base">
              Log in to your Eous account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-4 pb-8">
              {mfaRequired ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode">6-Digit 2FA Code</Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      placeholder="000000"
                      className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      maxLength={6}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onVerifyMfa();
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="text-sm text-primary hover:text-purple-600 transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-12 bg-background/50 focus-visible:ring-purple-500 transition-all pr-10 [&::-ms-reveal]:hidden"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 mt-4">
              {mfaRequired ? (
                <Button
                  type="button"
                  onClick={onVerifyMfa}
                  className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Log In"}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-12 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              )}
              <p className="text-sm text-center text-muted-foreground pt-2">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:text-purple-600 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
