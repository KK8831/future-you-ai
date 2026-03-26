import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional section name shown in the error card  */
  section?: string;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd send this to an error tracking service (eg. Sentry)
    console.error(`[ErrorBoundary:${this.props.section}]`, error, info);
  }

  handleReset = () => this.setState({ hasError: false, errorMsg: "" });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-destructive/5 border border-destructive/20 text-center">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {this.props.section
                ? `Something went wrong in ${this.props.section}`
                : "Something went wrong"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              This section encountered an error. Your data is safe.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
