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
import { GalaxyBackground } from './components/GalaxyBackground';

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
  const targetRound = room?.state?.targetRound;

  const isKdActive =
    currentRound === 'KD_RIENG' ||
    currentRound === 'KD_CHUNG' ||
    (currentRound === 'READY' && targetRound === 'KD_RIENG');

  const isVcnvActive =
    currentRound === 'VCNV' || (currentRound === 'READY' && targetRound === 'VCNV');

  const isTtActive =
    currentRound === 'TANG_TOC' || (currentRound === 'READY' && targetRound === 'TANG_TOC');

  const isVdActive =
    currentRound === 'VE_DICH' || (currentRound === 'READY' && targetRound === 'VE_DICH');

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
      <div className="h-screen h-[100dvh] max-h-screen w-full overflow-hidden text-[#F8FAFC] flex flex-col selection:bg-[#FFD43B] selection:text-[#090D18] relative">
        <GalaxyBackground />
        <Navbar />
        <main className="flex-1 min-h-0 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1450px] mx-auto px-2 py-1 sm:px-4 sm:py-2 flex flex-col items-center justify-center overflow-hidden relative">
          {renderCurrentView()}
        </main>
        {room && currentRound !== 'LOBBY' && currentRound !== 'FINISHED' && (
          <footer className="shrink-0 w-full z-30">
            <Scoreboard />
          </footer>
        )}
        {room && currentRound !== 'LOBBY' && (
          <div className="fixed top-3 right-44 sm:right-48 z-50 flex items-center gap-1.5 bg-[#111827]/90 backdrop-blur-md border border-[#303D52] shadow-xl rounded-xl px-2.5 py-1">
            <span className="text-xs font-bold text-[#94A3B8] font-heading uppercase tracking-wider">Tua:</span>
            <button
              onClick={() => jumpToRound('KD_RIENG')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all ${
                isKdActive
                  ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] font-black'
                  : 'bg-[#1C2638] text-[#94A3B8] hover:text-[#F8FAFC] border-[#303D52]'
              }`}
              title="Tua tới Vòng 1: Khởi Động"
            >
              V1
            </button>
            <button
              onClick={() => jumpToRound('VCNV')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all ${
                isVcnvActive
                  ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] font-black'
                  : 'bg-[#1C2638] text-[#94A3B8] hover:text-[#F8FAFC] border-[#303D52]'
              }`}
              title="Tua tới Vòng 2: Vượt Chướng Ngại Vật"
            >
              V2
            </button>
            <button
              onClick={() => jumpToRound('TANG_TOC')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all ${
                isTtActive
                  ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] font-black'
                  : 'bg-[#1C2638] text-[#94A3B8] hover:text-[#F8FAFC] border-[#303D52]'
              }`}
              title="Tua tới Vòng 3: Tăng Tốc"
            >
              V3
            </button>
            <button
              onClick={() => jumpToRound('VE_DICH')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all ${
                isVdActive
                  ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] font-black'
                  : 'bg-[#1C2638] text-[#94A3B8] hover:text-[#F8FAFC] border-[#303D52]'
              }`}
              title="Tua tới Vòng 4: Về Đích"
            >
              V4
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
