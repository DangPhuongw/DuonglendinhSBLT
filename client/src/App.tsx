import React, { Suspense, lazy, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Navbar } from './components/Navbar';
import { Scoreboard } from './components/Scoreboard';
import { Lobby } from './components/Lobby';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AntiCheatGuard } from './components/AntiCheatGuard';
import { GalaxyBackground } from './components/GalaxyBackground';
import { HopeStarBurst } from './components/HopeStarBurst';
import { VcnvKeywordFx } from './components/VcnvKeywordFx';
import { ReactionLayer } from './components/ReactionLayer';
import { ViewerReactionBar } from './components/ViewerReactionBar';
import { bgmManager } from './utils/bgmManager';

// Các màn vòng thi được tách thành gói riêng: lần mở trang đầu chỉ tải sảnh chờ (nhanh hơn trên điện thoại),
// rồi tải trước các màn còn lại khi trình duyệt rảnh, nên lúc vào trận không phải chờ.
const loaders = {
  ReadyScreen: () => import('./components/ReadyScreen').then((m) => ({ default: m.ReadyScreen })),
  KhoiDongRound: () => import('./components/KhoiDongRound').then((m) => ({ default: m.KhoiDongRound })),
  VcnvRound: () => import('./components/VcnvRound').then((m) => ({ default: m.VcnvRound })),
  TangTocRound: () => import('./components/TangTocRound').then((m) => ({ default: m.TangTocRound })),
  VeDichRound: () => import('./components/VeDichRound').then((m) => ({ default: m.VeDichRound })),
  TieBreakRound: () => import('./components/TieBreakRound').then((m) => ({ default: m.TieBreakRound })),
  RoundResults: () => import('./components/RoundResults').then((m) => ({ default: m.RoundResults })),
  Podium: () => import('./components/Podium').then((m) => ({ default: m.Podium })),
};
const ReadyScreen = lazy(loaders.ReadyScreen);
const KhoiDongRound = lazy(loaders.KhoiDongRound);
const VcnvRound = lazy(loaders.VcnvRound);
const TangTocRound = lazy(loaders.TangTocRound);
const VeDichRound = lazy(loaders.VeDichRound);
const TieBreakRound = lazy(loaders.TieBreakRound);
const RoundResults = lazy(loaders.RoundResults);
const Podium = lazy(loaders.Podium);

function prefetchScreens() {
  const run = () => Object.values(loaders).forEach((load) => load().catch(() => {}));
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}

export const App: React.FC = () => {
  const initSocket = useGameStore((s) => s.initSocket);
  // Chỉ theo dõi vòng hiện tại và có phòng hay không: App (và mọi lớp phủ) không phải vẽ lại mỗi lần
  // máy chủ gửi trạng thái. Từng màn hình tự lấy phần dữ liệu nó cần từ store.
  const hasRoom = useGameStore((s) => Boolean(s.room));
  const currentRound = useGameStore((s) => s.room?.state?.round || 'LOBBY');

  useEffect(() => {
    initSocket();
    prefetchScreens();

    // Check URL path like /r/ABC123 or ?room=ABC123
    const pathMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{6})/);
    const searchParams = new URLSearchParams(window.location.search);
    const roomFromUrl = pathMatch ? pathMatch[1] : searchParams.get('room');

    if (roomFromUrl) {
      localStorage.setItem('olympia_room_code', roomFromUrl.toUpperCase());
    }
  }, [initSocket]);


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
    if (!hasRoom || currentRound === 'LOBBY') {
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
      <div className="h-screen h-[100dvh] max-h-screen w-full overflow-hidden text-[#EEF0FF] flex flex-col selection:bg-[#F7C873] selection:text-[#05060F] relative">
        <GalaxyBackground />
        <Navbar />
        <AntiCheatGuard />
        <HopeStarBurst />
        <VcnvKeywordFx />
        <ReactionLayer />
        <ViewerReactionBar />
        <main className="flex-1 min-h-0 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1450px] mx-auto px-2 py-1 sm:px-4 sm:py-2 flex flex-col items-center justify-center overflow-hidden relative">
          <Suspense fallback={null}>{renderCurrentView()}</Suspense>
        </main>
        {hasRoom && currentRound !== 'LOBBY' && currentRound !== 'FINISHED' && currentRound !== 'ROUND_RESULTS' && (
          <footer className="shrink-0 w-full z-30">
            <Scoreboard />
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
