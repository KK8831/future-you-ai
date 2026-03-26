import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { Github, Twitter, Linkedin, Mail, Phone, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-16 px-8 lg:px-16" id="footer-about">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* About Us */}
        <div className="space-y-4">
          <BrandLogo size="md" className="mb-4" />
          <p className="text-muted-foreground leading-relaxed pr-4">
            FutureMe AI is a leading healthspan prediction platform offering high-quality longevity insights and exceptional AI-driven predictive care to help you meet your future self.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-widest">Company</h3>
          <ul className="space-y-3">
            <li><Link to="/" className="text-muted-foreground hover:text-accent transition-colors">Home</Link></li>
            <li><Link to="/#how-it-works" className="text-muted-foreground hover:text-accent transition-colors">How it works</Link></li>
            <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Support & Social */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-widest">Connect with Us</h3>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <a href="mailto:support@futureme.ai" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <Mail className="w-4 h-4" /> support@futureme.ai
            </a>
            <a href="tel:+18432614795" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <Phone className="w-4 h-4" /> +1 (843) 261-4795
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-foreground">Subscribe to Our Newsletter</h3>
          <form className="space-y-4 flex flex-col items-start" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="Enter your email address" required className="bg-card w-full shadow-sm" />
            <Button type="submit" className="bg-accent hover:bg-accent/80 text-white font-semibold px-8 shadow-md">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Copyright Line */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-foreground">
        <p className="flex items-center gap-2">
          © {new Date().getFullYear()} <BrandLogo size="sm" withText={false} iconOnly /> FutureMe AI. All rights reserved. | <span className="font-semibold text-muted-foreground ml-1">Powered by Predictive</span>
        </p>
        <div className="flex gap-3 items-center font-medium">
          <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>
          <span className="text-muted-foreground">|</span>
          <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}