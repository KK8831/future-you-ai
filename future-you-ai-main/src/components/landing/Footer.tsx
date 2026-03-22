import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-16 px-8 lg:px-16" id="footer-about">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
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
            <li><Link to="/" className="text-accent hover:underline font-medium transition-all">Home</Link></li>
            <li><Link to="/#footer-about" className="text-accent hover:underline font-medium transition-all">About Us</Link></li>
            <li><Link to="/#how-it-works" className="text-accent hover:underline font-medium transition-all">How it works</Link></li>
            <li><a href="tel:8432614795" className="text-accent hover:underline font-medium transition-all">Contact Us (8432614795)</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-foreground">Subscribe to Our Newsletter</h3>
          <form className="space-y-4 flex flex-col items-start" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="Enter your email address" required className="bg-card w-full shadow-sm" />
            <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700 text-white font-semibold px-8 shadow-md">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Copyright Line */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-foreground">
        <p>
          © {new Date().getFullYear()} FutureMe AI. All rights reserved. | <span className="font-semibold text-muted-foreground ml-1">Powered by Predictive</span>
        </p>
        <div className="flex gap-3 items-center font-medium">
          <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
          <span className="text-muted-foreground">|</span>
          <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}