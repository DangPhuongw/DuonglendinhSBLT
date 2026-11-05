import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Navbar } from './components/Navbar';
import { Scoreboard } from './components/Scoreboard';
import { Lobby } from './components/Lobby';
import { ReadyScreen } from './components/ReadyScreen';
import { KhoiDongRound } from './components/KhoiDongRound';
import { VcnvRound } from './components/VcnvRound';
import { TangTocRound } from './components/TangTocRound';
import { VeDichRound } from './components/VeDichRound';
import { TieBreakRound } from './components/TieBreakRound';
import { Podium } from './components/Podium';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  const initSocket = useGameStore((s) => s.initSocket);
  const room = useGameStore((s) => s.room);
  const jumpToRound = useGameStore((s) => s.jumpToRound);

  useEffect(() => {
    initSocket();

    // Check URL path like /r/ABC123 or ?room=ABC123
    const pathMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{6})/);
    const searchParams = new URLSearchParams(window.location.search);
    const roomFromUrl = pathMatch ? pathMatch[1] : searchParams.get('room');

    if (roomFromUrl) {
      localStorage.setItem('olympia_room_code', roomFromUrl.toUpperCase());
    }
  }, [initSocket]);

  const currentRound = room?.state?.round || 'LOBBY';

  const renderCurrentView = () => {
    if (!room || currentRound === 'LOBBY') {
      return <Lobby />;
    }

    if (currentRound === 'READY') {
      return <ReadyScreen />;
    }

    if (currentRound === 'KD_RIENG' || currentRound === 'KD_CHUNG') {
      return <KhoiDongRound />;
    }

    if (currentRound === 'VCNV') {
      return <VcnvRound />;
    }

    if (currentRound === 'TANG_TOC') {
      return <TangTocRound />;
    }

    if (currentRound === 'VE_DICH') {
      return <VeDichRound />;
    }

    if (currentRound === 'TIEBREAK') {
      return <TieBreakRound />;
    }

    if (currentRound === 'FINISHED') {
      return <Podium />;
    }

    return <Lobby />;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-amber-500 selection:text-black">
        <Navbar />
        {room && currentRound !== 'LOBBY' && <Scoreboard />}
        <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-center">
          {renderCurrentView()}
        </main>
        {room && currentRound !== 'LOBBY' && (
          <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 bg-slate-900/95 border-2 border-amber-500/80 shadow-2xl rounded-2xl p-2 backdrop-blur-md">
            <span className="text-[11px] font-black text-amber-400 px-1 uppercase">⏩ Tua:</span>
            <button
              onClick={() => jumpToRound('VCNV')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                currentRound === 'VCNV'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              VCNV
            </button>
            <button
              onClick={() => jumpToRound('TANG_TOC')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                currentRound === 'TANG_TOC'
                  ? 'bg-blue-400 text-white ring-2 ring-blue-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Tăng Tốc
            </button>
            <button
              onClick={() => jumpToRound('VE_DICH')}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                currentRound === 'VE_DICH'
                  ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              Về Đích
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
