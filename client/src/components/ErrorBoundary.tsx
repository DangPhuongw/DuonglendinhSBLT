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
        <div className="min-h-screen bg-[#090D18] text-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#111827] border border-[#303D52] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF496C]/20 border border-[#FF496C] flex items-center justify-center text-[#FF496C] shadow-glow-danger">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-black text-[#F8FAFC] mb-1">Đã có lỗi xảy ra</h2>
              <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
                Hệ thống gặp sự cố hiển thị. Vui lòng bấm làm mới để tải lại giao diện trận đấu.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-[#090D18] rounded-xl text-left text-xs font-mono text-[#FF496C] break-all max-h-28 overflow-y-auto border border-[#303D52]">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-bold text-sm transition-all border border-[#FFD43B] shadow-glow-yellow active:scale-95 cursor-pointer"
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
