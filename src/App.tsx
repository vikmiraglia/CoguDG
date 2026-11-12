/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  TOTAL_CARDS,
  GameStateData,
  createInitialGameState,
  executeCardDraw,
  advancePlayerTurn,
  getLossChance,
  formatRiskPercent,
  getTensionLevel,
  getRoundNumber,
  sanitizePlayers,
} from './game/rules';
import { soundEngine } from './game/audio';
import { AmbientSporeCanvas } from './components/AmbientSporeCanvas';
import { TitleSetupScreen } from './components/TitleSetupScreen';
import { TactileCardStage } from './components/TactileCardStage';
import {
  RulesDialog,
  HistoryDialog,
  PauseDialog,
  ConfirmDrawDialog,
  CardZoomLightbox,
  GameOverModal,
} from './components/GameModals';
import { speechEngine } from './game/speech';
import { getCardVoiceData } from './game/cardCatalog';
import {
  BookOpen,
  History,
  Volume2,
  VolumeX,
  Pause,
  Maximize2,
  Minimize2,
  ArrowRight,
  Sparkles,
  ZoomIn,
  Flame,
  Mic,
  MicOff,
  Volume1,
} from 'lucide-react';

const PLAYERS_STORAGE_KEY = 'cogu.players';
const PREFS_STORAGE_KEY = 'cogu.preferences';

function loadSavedPlayers(): string[] {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return sanitizePlayers(parsed);
      }
    }
  } catch {}
  return ['Jogador 1', 'Jogador 2'];
}

function loadSavedPrefs(): {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  confirmDraw: boolean;
} {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          soundEnabled: parsed.soundEnabled !== false,
          voiceEnabled: parsed.voiceEnabled !== false,
          confirmDraw: Boolean(parsed.confirmDraw),
        };
      }
    }
  } catch {}
  return { soundEnabled: true, voiceEnabled: true, confirmDraw: false };
}

export default function App() {
  const [players, setPlayers] = useState<string[]>(() => loadSavedPlayers());
  const [prefs, setPrefs] = useState(() => loadSavedPrefs());
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [gameState, setGameState] = useState<GameStateData>(() => {
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';
    const initial = createInitialGameState(loadSavedPlayers());
    return {
      ...initial,
      status: isAutostart ? 'playing' : 'title',
    };
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync document.body.dataset.state with game state machine
  useEffect(() => {
    document.body.dataset.state = gameState.status;
  }, [gameState.status]);

  // Sync audio and voice preferences
  useEffect(() => {
    soundEngine.enabled = prefs.soundEnabled;
    speechEngine.enabled = prefs.voiceEnabled;
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  // Persist players list
  const handleUpdatePlayers = useCallback((nextPlayers: string[]) => {
    setPlayers(nextPlayers);
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(nextPlayers));
    } catch {}
  }, []);

  // Preload next 3 cards in deck so card flips are instantaneous
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    const upcoming = gameState.deck.slice(0, 3);
    upcoming.forEach((cardId) => {
      const img = new Image();
      img.src = `/assets/cards/${cardId}.png`;
    });
  }, [gameState.status, gameState.deck]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    soundEngine.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  };

  const handleStartGame = useCallback(() => {
    const clean = sanitizePlayers(players);
    handleUpdatePlayers(clean);
    const fresh = createInitialGameState(clean);
    setGameState(fresh);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [players, handleUpdatePlayers]);

  const narrateCard = useCallback((cardId: number) => {
    const cardData = getCardVoiceData(cardId);
    if (!cardData || !prefs.voiceEnabled) return;
    setIsSpeaking(true);
    speechEngine.speak(cardData.narration, () => {
      setIsSpeaking(false);
    });
  }, [prefs.voiceEnabled]);

  const performDrawStep = useCallback(() => {
    if (isDrawing || gameState.status !== 'playing' || gameState.currentCard !== null) {
      return;
    }

    const nextDrawNum = Math.min(gameState.drawnCount + 1, TOTAL_CARDS);
    const tension = getTensionLevel(nextDrawNum);

    setIsDrawing(true);
    speechEngine.cancel();
    setIsSpeaking(false);
    soundEngine.playSuspenseRoll(tension.intensity);

    setTimeout(() => {
      setGameState((prev) => {
        const { nextState, result } = executeCardDraw(prev);
        if (result === 'loss') {
          soundEngine.playLossSiren();
          if (prefs.voiceEnabled) {
            const loser = nextState.loserName || 'Você';
            speechEngine.speak(`Atenção mesa! ${loser} perdeu ao puxar a carta! Vire o copo agora!`);
          }
        } else if (result === 'drawn') {
          soundEngine.playCardReveal(tension.intensity);
          if (nextState.currentCard !== null) {
            // Slight delay so the crisp card flip sound plays first
            setTimeout(() => {
              if (nextState.currentCard !== null) {
                narrateCard(nextState.currentCard);
              }
            }, 280);
          }
        } else if (result === 'empty') {
          soundEngine.playFanfare();
          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch {}
          if (prefs.voiceEnabled) {
            speechEngine.speak('Incrível! Todas as sessenta cartas foram vencidas sem ninguém virar o copo!');
          }
        }
        return nextState;
      });
      setIsDrawing(false);
    }, 240);
  }, [isDrawing, gameState.status, gameState.currentCard, gameState.drawnCount, prefs.voiceEnabled, narrateCard]);

  const handleRequestDraw = useCallback(() => {
    if (isDrawing || gameState.status !== 'playing' || gameState.currentCard !== null) {
      return;
    }
    if (prefs.confirmDraw) {
      soundEngine.playClick();
      setShowConfirmModal(true);
    } else {
      performDrawStep();
    }
  }, [isDrawing, gameState.status, gameState.currentCard, prefs.confirmDraw, performDrawStep]);

  const handleNextPlayer = useCallback(() => {
    if (gameState.status !== 'playing' || gameState.currentCard === null) return;
    soundEngine.playClick();
    speechEngine.cancel();
    setIsSpeaking(false);
    setGameState((prev) => {
      const next = advancePlayerTurn(prev);
      if (next.outcome === 'deck_cleared') {
        soundEngine.playFanfare();
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {}
      }
      return next;
    });
  }, [gameState.status, gameState.currentCard]);

  // Keyboard shortcuts (Enter / Space for Title & Gameplay, Escape / P for Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (showRules || showHistory || showConfirmModal || zoomedCard !== null) {
        if (e.key === 'Escape') {
          setShowRules(false);
          setShowHistory(false);
          setShowConfirmModal(false);
          setZoomedCard(null);
        }
        return;
      }

      if (gameState.status === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          soundEngine.playFanfare();
          handleStartGame();
        }
        return;
      }

      if (gameState.status === 'playing') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          soundEngine.playClick();
          setGameState((prev) => ({ ...prev, status: 'paused' }));
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (gameState.currentCard === null) {
            handleRequestDraw();
          } else {
            handleNextPlayer();
          }
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setPrefs((p) => ({ ...p, soundEnabled: !p.soundEnabled }));
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          soundEngine.playClick();
          setPrefs((p) => {
            const nextVoice = !p.voiceEnabled;
            if (!nextVoice) {
              speechEngine.cancel();
              setIsSpeaking(false);
            }
            return { ...p, voiceEnabled: nextVoice };
          });
        }
        return;
      }

      if (gameState.status === 'paused') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          soundEngine.playClick();
          setGameState((prev) => ({ ...prev, status: 'playing' }));
        }
        return;
      }

      if (gameState.status === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          soundEngine.playFanfare();
          handleStartGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState.status,
    gameState.currentCard,
    showRules,
    showHistory,
    showConfirmModal,
    zoomedCard,
    handleStartGame,
    handleRequestDraw,
    handleNextPlayer,
  ]);

  const nextDrawNumber = Math.min(gameState.drawnCount + 1, TOTAL_CARDS);
  const currentChance = getLossChance(
    gameState.currentCard !== null ? gameState.drawnCount : nextDrawNumber
  );
  const riskPercent = formatRiskPercent(currentChance);
  const tension = getTensionLevel(
    gameState.currentCard !== null ? gameState.drawnCount : nextDrawNumber
  );
  const remainingCount = TOTAL_CARDS - gameState.drawnCount;
  const roundNumber = getRoundNumber(
    Math.max(1, gameState.drawnCount),
    gameState.players.length
  );
  const currentPlayerName =
    gameState.players[gameState.currentPlayerIndex] || 'Jogador 1';

  return (
    <div className="relative min-h-dvh w-full bg-[#0d0b0a] text-[#f5efe6] flex flex-col overflow-hidden">
      {/* Live Ambient Spore & Tension Spotlight Background */}
      <AmbientSporeCanvas
        intensity={gameState.status === 'title' ? 0.15 : tension.intensity}
        isLoss={gameState.status === 'gameover' && gameState.outcome === 'loss'}
      />

      {/* Peripheral Crimson Vignette when Risk is High */}
      {gameState.status === 'playing' && tension.intensity > 0.45 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
          style={{
            boxShadow: `inset 0 0 ${60 + tension.intensity * 80}px rgba(185, 28, 28, ${
              (tension.intensity - 0.4) * 0.45
            })`,
          }}
        />
      )}

      {/* SCREEN 1: TITLE & SETUP */}
      {gameState.status === 'title' && (
        <TitleSetupScreen
          players={players}
          soundEnabled={prefs.soundEnabled}
          voiceEnabled={prefs.voiceEnabled}
          confirmDraw={prefs.confirmDraw}
          onUpdatePlayers={handleUpdatePlayers}
          onToggleSound={(val) => setPrefs((p) => ({ ...p, soundEnabled: val }))}
          onToggleVoice={(val) => setPrefs((p) => ({ ...p, voiceEnabled: val }))}
          onToggleConfirmDraw={(val) => setPrefs((p) => ({ ...p, confirmDraw: val }))}
          onStartGame={handleStartGame}
          onOpenRules={() => setShowRules(true)}
        />
      )}

      {/* SCREEN 2: ACTIVE GAMEPLAY TABLE */}
      {gameState.status !== 'title' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-6xl w-full mx-auto px-4 py-3 sm:px-8 sm:py-5">
          {/* Top Perimeter HUD Bar */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f5efe6]/10">
            {/* Left: Current Player Turn Anchor */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#b8ab99] whitespace-nowrap shrink-0">
                <span>Vez de jogar</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#d4af37]">
                  Rodada {roundNumber}
                </span>
              </div>
              <div
                id="currentPlayerName"
                className="text-lg sm:text-2xl font-bold text-[#f5efe6] truncate"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {currentPlayerName}
              </div>
            </div>

            {/* Center: Essential Live Metrics (Risk & Remaining Cards) */}
            <div className="hidden md:flex items-center gap-8 bg-[#16120f]/90 border border-[#f5efe6]/10 rounded-2xl px-5 py-2">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[#b8ab99]">
                  Baralho
                </span>
                <strong className="font-mono tabular-nums text-base font-bold text-[#f5efe6]">
                  {remainingCount} restantes
                </strong>
              </div>
              <div className="h-7 w-px bg-[#f5efe6]/10" aria-hidden="true" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[#b8ab99]">
                  Risco do Copo
                </span>
                <div className="flex items-center gap-1.5">
                  <Flame
                    className={`w-4 h-4 ${
                      tension.intensity > 0.5 ? 'text-[#ef4444]' : 'text-[#d4af37]'
                    }`}
                  />
                  <strong
                    className={`font-mono tabular-nums text-base font-bold ${
                      tension.intensity > 0.5 ? 'text-[#ef4444]' : 'text-[#d4af37]'
                    }`}
                  >
                    {riskPercent}
                  </strong>
                  <span className="text-xs text-[#b8ab99]">· {tension.label}</span>
                </div>
              </div>
            </div>

            {/* Right: Compact Icon Utility Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowHistory(true);
                }}
                aria-label="Histórico de cartas"
                title="Histórico de cartas"
                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <History className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="hidden sm:inline">Histórico</span>
                {gameState.history.length > 0 && (
                  <span className="font-mono tabular-nums text-[11px] text-[#b8ab99]">
                    ({gameState.history.length})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowRules(true);
                }}
                aria-label="Regras do jogo"
                title="Regras do jogo"
                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span className="hidden sm:inline">Regras</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  const nextVoice = !prefs.voiceEnabled;
                  setPrefs((p) => ({ ...p, voiceEnabled: nextVoice }));
                  if (!nextVoice) {
                    speechEngine.cancel();
                    setIsSpeaking(false);
                  } else if (gameState.currentCard !== null) {
                    narrateCard(gameState.currentCard);
                  }
                }}
                aria-label={prefs.voiceEnabled ? 'Desativar narração por voz' : 'Ativar narração por voz'}
                title={prefs.voiceEnabled ? 'Narração por voz: Ativada (V)' : 'Narração por voz: Desativada (V)'}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {prefs.voiceEnabled ? (
                  <Mic className={`w-4 h-4 text-[#d4af37] ${isSpeaking ? 'animate-pulse' : ''}`} />
                ) : (
                  <MicOff className="w-4 h-4 text-[#b8ab99]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
                aria-label={prefs.soundEnabled ? 'Desativar som' : 'Ativar som'}
                title={prefs.soundEnabled ? 'Desativar som (M)' : 'Ativar som (M)'}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {prefs.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#d4af37]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#b8ab99]" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-[#d4af37]" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-[#d4af37]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setGameState((prev) => ({ ...prev, status: 'paused' }));
                }}
                aria-label="Pausar jogo"
                title="Pausar (Esc)"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 hover:border-[#d4af37]/50 text-[#f5efe6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Pause className="w-4 h-4 text-[#d4af37]" />
              </button>
            </div>
          </div>

          {/* Mobile Compact Risk & Deck Sub-Strip */}
          <div className="flex md:hidden items-center justify-between text-xs text-[#b8ab99] pt-1.5 whitespace-nowrap">
            <span>
              Restantes:{' '}
              <strong className="font-mono tabular-nums text-[#f5efe6]">
                {remainingCount} / 60
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <Flame
                className={`w-3.5 h-3.5 ${
                  tension.intensity > 0.5 ? 'text-[#ef4444]' : 'text-[#d4af37]'
                }`}
              />
              <span>Risco:</span>
              <strong
                className={`font-mono tabular-nums ${
                  tension.intensity > 0.5 ? 'text-[#ef4444]' : 'text-[#d4af37]'
                }`}
              >
                {riskPercent}
              </strong>
              <span>· {tension.label}</span>
            </span>
          </div>

          {/* Tension Progress Hairline Bar */}
          <div className="w-full h-1 bg-[#f5efe6]/10 rounded-full overflow-hidden my-1.5">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(gameState.drawnCount / TOTAL_CARDS) * 100}%`,
                backgroundColor: tension.intensity > 0.5 ? '#ef4444' : '#d4af37',
              }}
            />
          </div>

          {/* Center Table Area: 2.5D Card Stage + Action Panel */}
          <div className="my-auto py-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10 items-center">
            {/* Card Centerpiece */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              <TactileCardStage
                currentCard={gameState.currentCard}
                remainingCount={remainingCount}
                isDrawing={isDrawing}
                tensionIntensity={tension.intensity}
                onCardClick={handleRequestDraw}
                onExpandCard={() => {
                  if (gameState.currentCard) {
                    soundEngine.playClick();
                    setZoomedCard(gameState.currentCard);
                  }
                }}
              />

              {/* Subtle helper action under card */}
              {gameState.currentCard !== null ? (
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      if (gameState.currentCard !== null) {
                        narrateCard(gameState.currentCard);
                      }
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isSpeaking
                        ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40'
                        : 'bg-[#181411] text-[#b8ab99] hover:text-[#f5efe6] border border-[#f5efe6]/10'
                    }`}
                  >
                    <Volume1 className={`w-3.5 h-3.5 text-[#d4af37] ${isSpeaking ? 'animate-pulse' : ''}`} />
                    <span>{isSpeaking ? 'Narrando...' : 'Ouvir novamente'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setZoomedCard(gameState.currentCard);
                    }}
                    className="min-h-[34px] px-3 py-1 rounded-lg text-xs bg-[#181411] text-[#b8ab99] hover:text-[#f5efe6] border border-[#f5efe6]/10 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Ampliar carta</span>
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-xs text-[#b8ab99]/80">
                  Toque diretamente no baralho ou no botão para puxar
                </p>
              )}
            </div>

            {/* Right / Bottom Action Callout & Primary CTA */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-stretch text-center lg:text-left">
              <div className="w-full bg-[#15120f]/95 border border-[#f5efe6]/12 rounded-3xl p-4 sm:p-6 shadow-2xl">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1">
                  {gameState.currentCard === null
                    ? `Turno de ${currentPlayerName}`
                    : `Carta #${gameState.currentCard} na Mesa`}
                </div>

                <h2
                  className="text-lg sm:text-2xl font-bold text-[#f5efe6] leading-snug mb-1.5"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  {gameState.currentCard === null
                    ? 'Pronto para testar sua sorte?'
                    : `${currentPlayerName}, leia em voz alta para a roda!`}
                </h2>

                <p className="text-xs sm:text-sm text-[#b8ab99] leading-relaxed mb-4">
                  {gameState.currentCard === null
                    ? `Puxe a ${nextDrawNumber}ª carta do baralho. Chance atual de virar o copo: ${riskPercent}.`
                    : 'Cumpra o que a carta manda com seus amigos. Quando terminarem, passe a vez.'}
                </p>

                {gameState.currentCard === null ? (
                  <button
                    type="button"
                    disabled={isDrawing}
                    onClick={handleRequestDraw}
                    className="w-full min-h-[50px] sm:min-h-[54px] py-3 px-6 rounded-2xl bg-[#d4af37] hover:bg-[#e3be42] active:scale-[0.99] text-[#0d0b0a] font-bold text-base tracking-wide shadow-[0_12px_30px_rgba(212,175,55,0.28)] flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{isDrawing ? 'Sorteando...' : 'Puxar Carta'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextPlayer}
                    className="w-full min-h-[50px] sm:min-h-[54px] py-3 px-6 rounded-2xl bg-[#f5efe6] hover:bg-white active:scale-[0.99] text-[#0d0b0a] font-bold text-base tracking-wide shadow-[0_12px_30px_rgba(245,239,230,0.2)] flex items-center justify-center gap-2.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Próximo Jogador</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Turn Order Strip (Clean Unboxed Typography with · separators) */}
          <div className="pt-2 border-t border-[#f5efe6]/10 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2.5 py-1 text-xs whitespace-nowrap">
              <span className="text-[#b8ab99]/70 uppercase tracking-wider text-[10px]">
                Roda:
              </span>
              {gameState.players.map((player, idx) => {
                const isActive = idx === gameState.currentPlayerIndex;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <span className="text-[#b8ab99]/40" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <span
                      className={`transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'text-[#d4af37] font-bold underline underline-offset-4 decoration-[#d4af37]'
                          : 'text-[#b8ab99]'
                      }`}
                    >
                      {idx + 1}. {player}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            <span className="hidden sm:inline text-[11px] text-[#b8ab99]/70 whitespace-nowrap shrink-0">
              Espaço: {gameState.currentCard === null ? 'Puxar' : 'Próximo'} · Esc: Menu
            </span>
          </div>
        </main>
      )}

      {/* MODALS */}
      <RulesDialog open={showRules} onClose={() => setShowRules(false)} />

      <HistoryDialog
        open={showHistory}
        history={gameState.history}
        onClose={() => setShowHistory(false)}
        onSelectCard={(cardId) => setZoomedCard(cardId)}
      />

      <PauseDialog
        open={gameState.status === 'paused'}
        onResume={() => setGameState((prev) => ({ ...prev, status: 'playing' }))}
        onRestart={() => {
          const fresh = createInitialGameState(gameState.players);
          setGameState(fresh);
        }}
        onBackToSetup={() => {
          setGameState((prev) => ({ ...prev, status: 'title', currentCard: null }));
        }}
      />

      <ConfirmDrawDialog
        open={showConfirmModal}
        playerName={currentPlayerName}
        riskPercent={riskPercent}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          performDrawStep();
        }}
      />

      <CardZoomLightbox cardId={zoomedCard} onClose={() => setZoomedCard(null)} />

      <GameOverModal
        open={gameState.status === 'gameover'}
        outcome={gameState.outcome}
        loserName={gameState.loserName}
        loserDrawNumber={gameState.loserDrawNumber}
        drawnCount={gameState.drawnCount}
        roundNumber={roundNumber}
        riskAtEnd={formatRiskPercent(getLossChance(Math.max(1, gameState.drawnCount)))}
        onPlayAgain={handleStartGame}
        onBackToSetup={() => {
          setGameState((prev) => ({ ...prev, status: 'title', currentCard: null }));
        }}
      />
    </div>
  );
}
