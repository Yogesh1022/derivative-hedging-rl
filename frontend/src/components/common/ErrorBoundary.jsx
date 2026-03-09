import { Component } from "react";
import { C } from "../../constants/colors";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            background: C.bgLight,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, textAlign: "center" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: 24, width: "100%", maxWidth: 600 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.textSub,
                  marginBottom: 8,
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 11,
                  overflow: "auto",
                  maxHeight: 200,
                  color: C.red,
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              background: C.accent,
              color: C.white,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
