import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In real beta we would send this to logging service
    console.error('ROBOAGENT ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center bg-[#f7f7f5] p-6 text-center">
          <div>
            <p className="text-lg font-black text-[#172231]">Something went wrong.</p>
            <p className="mt-2 text-sm text-slate-600">The ROBOAGENT team has been notified. Please refresh or try again in a moment.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-2xl bg-[#172231] px-6 py-2 text-sm font-black text-white"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
