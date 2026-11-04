import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Đã có lỗi xảy ra</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống gặp sự cố hiển thị. Vui lòng bấm làm mới để tải lại giao diện trận đấu.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2 bg-slate-950 rounded-lg text-left text-[11px] font-mono text-rose-300 break-all max-h-28 overflow-y-auto border border-rose-950">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <RefreshCw size={16} />
              <span>Làm mới trang (F5)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
