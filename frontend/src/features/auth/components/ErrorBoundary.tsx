import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center font-outfit bg-gray-50">
          <div className="text-center">
            <h2 className="text-title-md font-bold text-gray-900 mb-4">
              Đã xảy ra lỗi
            </h2>
            <p className="text-theme-sm text-gray-600 mb-4">
              {this.state.error?.message || "Có lỗi xảy ra. Vui lòng thử lại sau."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-warning-500 text-white py-2 px-4 rounded-lg font-bold transition-all duration-300 button-hover hover:bg-warning-600"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;