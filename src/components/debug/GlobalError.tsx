import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-red-500 p-8 font-mono overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">CRITICAL APPLICATION CRASH</h1>
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded mb-4">
                        <h2 className="text-xl text-white mb-2">{this.state.error?.name}: {this.state.error?.message}</h2>
                        <details className="whitespace-pre-wrap text-xs text-gray-400">
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        RELOAD APPLICATION
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
