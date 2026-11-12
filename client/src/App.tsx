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
import { RoundResults } from './components/RoundResults';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AntiCheatGuard } from './components/AntiCheatGuard';
import { GalaxyBackground } from './components/GalaxyBackground';
import { HopeStarBurst } from './components/HopeStarBurst';
import { bgmManager } from './utils/bgmManager';

export const App: React.FC = () => {
  const initSocket = useGameStore((s) => s.initSocket);
  const room = useGameStore((s) => s.room);

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

  // Manage background music according to game state:
  // - LOBBY, READY: Theme song (soft volume)
  // - KD_RIENG, KD_CHUNG, VCNV, TANG_TOC, VE_DICH, TIEBREAK: Question countdown music
  // - FINISHED: Theme song (loud celebratory volume)
  useEffect(() => {
    bgmManager.setRound(currentRound);

    return () => {
      bgmManager.stop();
    };
  }, [currentRound]);

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

    if (currentRound === 'ROUND_RESULTS') {
      return <RoundResults />;
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
        <AntiCheatGuard />
        <HopeStarBurst />
        <main className="flex-1 min-h-0 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1450px] mx-auto px-2 py-1 sm:px-4 sm:py-2 flex flex-col items-center justify-center overflow-hidden relative">
          {renderCurrentView()}
        </main>
        {room && currentRound !== 'LOBBY' && currentRound !== 'FINISHED' && currentRound !== 'ROUND_RESULTS' && (
          <footer className="shrink-0 w-full z-30">
            <Scoreboard />
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
