import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you would log to an error reporting service like Sentry
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-slate-400 mt-1">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="w-full justify-center"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
