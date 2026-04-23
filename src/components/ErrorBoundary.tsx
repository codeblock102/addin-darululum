import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global error boundary — wraps the entire app so any unhandled render
 * error shows a helpful recovery screen instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled render error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-xl border border-red-100 shadow-sm p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle className="h-7 w-7 text-red-500" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
              <p className="text-sm text-gray-500 mt-1">
                The app hit an unexpected error. This has been logged.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono">
                <summary className="cursor-pointer font-sans text-sm text-gray-700 font-medium mb-1">
                  Error details
                </summary>
                <p className="mt-2 break-all">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap text-gray-500 text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            <Button
              onClick={this.handleReset}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
