import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.message || "An unexpected error occurred. Please try again."}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.reload();
            }}
          >
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
