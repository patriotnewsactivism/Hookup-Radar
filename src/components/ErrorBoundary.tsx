import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  incidentId: string | null;
}

function createIncidentId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `incident-${Date.now().toString(36)}`;
  }
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, incidentId: null };

  static getDerivedStateFromError(): State {
    return { hasError: true, incidentId: createIncidentId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep diagnostic details out of rendered UI. Console output is available to
    // operators during development and can be replaced by protected telemetry.
    console.error("Unhandled application error", {
      incidentId: this.state.incidentId,
      error,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <AlertTriangle size={48} className="mb-6 flex-shrink-0 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Something went wrong.</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Reload the app and try again. If the problem continues, include the incident ID below when reporting it.
          </p>
          {this.state.incidentId && (
            <code className="mb-6 rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
              {this.state.incidentId}
            </code>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          >
            <RotateCcw size={16} /> Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
