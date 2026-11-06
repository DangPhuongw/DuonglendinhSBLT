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
        <div className="min-h-screen bg-[#FFFDF7] text-[#171717] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border-3 border-[#171717] rounded-3xl p-6 sm:p-8 shadow-neo-lg flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF9292] border-2 border-[#171717] flex items-center justify-center text-[#171717] shadow-neo-sm">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#171717] mb-1">Đã có lỗi xảy ra</h2>
              <p className="text-xs text-gray-700 font-bold leading-relaxed">
                Hệ thống gặp sự cố hiển thị. Vui lòng bấm làm mới để tải lại giao diện trận đấu.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-gray-100 rounded-xl text-left text-xs font-mono text-gray-800 break-all max-h-28 overflow-y-auto border-2 border-[#171717]">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black text-sm transition-all border-2 border-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
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
