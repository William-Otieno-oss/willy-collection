import React from "react";
import Card from "./Card";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    // Error boundary caught exception
    // Store error info for debugging

    // Increment error count and reset if too many errors occur
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // If error count exceeds 5 in development, disable error boundary for debugging
    if (process.env.NODE_ENV !== "production" && this.state.errorCount > 5) {
      throw error;
    }
  }

  renderErrorUI() {
    const isDevelopment = process.env.NODE_ENV !== "production";

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-20">
        <Card className="p-6 sm:p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Oops! Something Went Wrong
            </h1>
            <p className="text-neutral-600 mb-6">
              We encountered an unexpected error. Our team has been notified.
              Please try refreshing the page or contact support.
            </p>

            {isDevelopment && this.state.error && (
              <div className="mb-6 p-4 bg-error-light border border-error rounded-lg text-left">
                <p className="text-sm font-mono text-error break-words">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4 text-xs">
                    <summary className="cursor-pointer font-semibold text-error">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-error overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="block w-full px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold rounded-lg transition-all text-center"
              >
                Go Home
              </a>
            </div>

            <p className="mt-6 text-sm text-neutral-600">
              Need help?{" "}
              <a
                href="mailto:support@willy.com"
                className="text-accent hover:underline font-semibold"
              >
                Contact us
              </a>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
