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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />
      {room && currentRound !== 'LOBBY' && <Scoreboard />}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col justify-center">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;
