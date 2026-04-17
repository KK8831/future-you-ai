import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User as UserIcon, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkOnboarding = async (user: User) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      // If the query fails or no profile exists, send to onboarding
      if (error || !profile) {
        navigate("/onboarding");
        return;
      }

      // Check if user has completed onboarding (has age set)
      const hasAge = profile.age !== null && profile.age !== undefined;
      const hasHealthGoals = 'health_goals' in profile && 
        profile.health_goals && 
        (Array.isArray(profile.health_goals) ? (profile.health_goals as any[]).length > 0 : true);
      
      if (!hasAge) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          if (event === "SIGNED_IN") {
            checkOnboarding(session.user);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkOnboarding(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({
        email,
        password,
        fullName: !isLogin ? fullName : undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to FutureMe AI.",
        });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast({
          title: "Welcome to FutureMe AI!",
          description: "Your account has been created. You're now signed in.",
        });
      }
    } catch (error: any) {
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email before signing in.";
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-health-blue/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <Link to="/" className="mb-12 block hover:opacity-90 transition-opacity">
            <BrandLogo size="lg" className="text-primary-foreground" />
          </Link>

          <h1 className="text-4xl xl:text-5xl font-display font-bold mb-6 leading-tight">
            Your Future Self<br />
            <span className="gradient-text-hero">Starts Today</span>
          </h1>

          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Create your AI-powered digital twin and unlock predictive health intelligence for a healthier tomorrow.
          </p>

          {/* Features list */}
          <div className="mt-12 space-y-4">
            {[
              "Personalized lifestyle analysis",
              "AI-powered health predictions",
              "Future scenario simulations",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-primary-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <BrandLogo size="md" />
            </Link>
          </div>

          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your digital twin"
                : "Start your journey to predictive health"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {/* Forgot Password link — only show in login mode */}
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-muted-foreground hover:text-accent transition-colors mt-1 text-right w-full"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {isForgotPassword && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                {forgotSent ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-foreground">✉️ Reset email sent!</p>
                    <p className="text-xs text-muted-foreground">Check your inbox for a password reset link from FutureMe AI.</p>
                    <button onClick={() => { setIsForgotPassword(false); setForgotSent(false); }} className="text-xs text-accent hover:underline">Back to sign in</button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <p className="text-xs text-muted-foreground">Enter your email and we'll send a reset link.</p>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-10 text-sm"
                      required
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsForgotPassword(false)} className="flex-1 text-xs text-muted-foreground hover:text-foreground py-2 rounded-lg border border-border transition-colors">Cancel</button>
                      <Button type="submit" size="sm" className="flex-1" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Legal consent notice */}
            {!isLogin && (
              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>.
                FutureMe AI is not a medical device.
              </p>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-accent font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>

      {/* Footer Section */}
      <footer className="bg-background border-t border-border py-12 px-8 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Us */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold text-foreground">About Us</h3>
            <p className="text-muted-foreground leading-relaxed pr-4">
              FutureMe AI is a leading healthspan prediction platform offering high-quality longevity insights and exceptional AI-driven predictive care to help you meet your future self.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-accent underline font-medium">Home</Link></li>
              <li><Link to="/#about" className="text-accent underline font-medium">About Us</Link></li>
              <li><Link to="/#how-it-works" className="text-accent underline font-medium">How it works</Link></li>
              <li><a href="tel:8432614795" className="text-accent underline font-medium">Contact Us (8432614795)</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold text-foreground">Subscribe to Our Newsletter</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" placeholder="Enter your email" required className="bg-card w-full" />
              <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700 text-white font-medium px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-foreground">
          <p>
            © {new Date().getFullYear()} FutureMe AI. All rights reserved. | <span className="font-semibold text-muted-foreground ml-1">Powered by Predictive</span>
          </p>
          <div className="flex gap-2 items-center">
            <Link to="/privacy-policy" className="text-accent underline">Privacy Policy</Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/terms" className="text-accent underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;