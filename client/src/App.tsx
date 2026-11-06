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
      <div className="min-h-screen bg-[#FFFDF7] text-[#171717] flex flex-col selection:bg-[#FFE45C] selection:text-[#171717] relative">
        <Navbar />
        {room && currentRound !== 'LOBBY' && <Scoreboard />}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3 py-3 sm:px-6 sm:py-4 flex flex-col justify-start">
          {renderCurrentView()}
        </main>
        {room && currentRound !== 'LOBBY' && (
          <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 bg-white border-2 border-[#171717] shadow-neo rounded-xl p-2">
            <span className="text-[11px] font-extrabold text-[#171717] px-1 uppercase tracking-wider">⏩ Tua:</span>
            <button
              onClick={() => jumpToRound('VCNV')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-[#171717] transition-all ${
                currentRound === 'VCNV'
                  ? 'bg-[#FFE45C] text-[#171717] shadow-neo-sm'
                  : 'bg-white hover:bg-[#FFE45C] text-[#171717] active:translate-x-0.5 active:translate-y-0.5'
              }`}
            >
              VCNV
            </button>
            <button
              onClick={() => jumpToRound('TANG_TOC')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-[#171717] transition-all ${
                currentRound === 'TANG_TOC'
                  ? 'bg-[#66C7F2] text-[#171717] shadow-neo-sm'
                  : 'bg-white hover:bg-[#66C7F2] text-[#171717] active:translate-x-0.5 active:translate-y-0.5'
              }`}
            >
              Tăng Tốc
            </button>
            <button
              onClick={() => jumpToRound('VE_DICH')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-[#171717] transition-all ${
                currentRound === 'VE_DICH'
                  ? 'bg-[#55D6C2] text-[#171717] shadow-neo-sm'
                  : 'bg-white hover:bg-[#55D6C2] text-[#171717] active:translate-x-0.5 active:translate-y-0.5'
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
