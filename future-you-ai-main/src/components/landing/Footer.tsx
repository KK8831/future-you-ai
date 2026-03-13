import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 bg-primary border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-display font-bold text-primary-foreground">
              FutureMe AI
            </span>
          </Link>

          {/* Disclaimer */}
          <p className="text-sm text-primary-foreground/60 text-center max-w-md">
            <strong>Disclaimer:</strong> This is a CSE major project for educational purposes only. 
            Not intended for medical advice or diagnosis.
          </p>

          {/* Copyright */}
          <p className="text-sm text-primary-foreground/60">
            © 2025 FutureMe AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}