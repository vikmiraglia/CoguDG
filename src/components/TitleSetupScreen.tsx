import React, { useState } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS, getCardImageUrl } from '../game/rules';
import { CoguTitleEmblem } from './CoguTitleEmblem';

import { soundEngine } from '../game/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Plus, Trash2, Volume2, VolumeX, ShieldCheck, BookOpen, Download, Sparkles, Mic, MicOff } from 'lucide-react';

interface TitleSetupScreenProps {
  players: string[];
  soundEnabled: boolean;
  voiceEnabled: boolean;
  confirmDraw: boolean;
  onUpdatePlayers: (next: string[]) => void;
  onToggleSound: (val: boolean) => void;
  onToggleVoice: (val: boolean) => void;
  onToggleConfirmDraw: (val: boolean) => void;
  onStartGame: () => void;
  onOpenRules: () => void;
}

export const TitleSetupScreen: React.FC<TitleSetupScreenProps> = ({
  players,
  soundEnabled,
  voiceEnabled,
  confirmDraw,
  onUpdatePlayers,
  onToggleSound,
  onToggleVoice,
  onToggleConfirmDraw,
  onStartGame,
  onOpenRules,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [cardTilt, setCardTilt] = useState({ rx: 4, ry: -8 });

  const handlePlayerChange = (index: number, value: string) => {
    const next = [...players];
    next[index] = value;
    onUpdatePlayers(next);
  };

  const handleAddPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    soundEngine.playClick();
    onUpdatePlayers([...players, `Jogador ${players.length + 1}`]);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= MIN_PLAYERS) return;
    soundEngine.playClick();
    const next = players.filter((_, i) => i !== index);
    onUpdatePlayers(next);
  };

  return (
    <div className="relative z-10 min-h-dvh w-full flex flex-col justify-between px-4 py-6 sm:px-8 lg:px-14 max-w-6xl mx-auto">
      {/* Top Bar: Utility actions only (Rules, Sound, Install App) */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-medium tracking-wider text-[#b8ab99]">
          <span>2 a 8 jogadores</span>
          <span className="mx-2 text-[#d4af37]" aria-hidden="true">·</span>
          <span>60 cartas autorais</span>
          <span className="mx-2 text-[#d4af37]" aria-hidden="true">·</span>
          <span>Risco progressivo</span>
        </div>

        <div className="flex items-center gap-2">
          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                install();
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5efe6] text-xs font-semibold flex items-center gap-2 hover:bg-[#d4af37]/25 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>Instalar App</span>
            </button>
          )}
          {!isInstalled && !isInstallable && isIOS && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowIOSModal(true);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5efe6] text-xs font-semibold flex items-center gap-2 hover:bg-[#d4af37]/25 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-[#d4af37]" />
              <span>Instalar no iPhone</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenRules();
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181411] border border-[#f5efe6]/12 text-[#f5efe6] text-xs font-medium flex items-center gap-2 hover:border-[#d4af37]/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-[#d4af37]" />
            <span>Regras</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleVoice(!voiceEnabled);
            }}
            aria-label={voiceEnabled ? 'Desativar narração por voz' : 'Ativar narração por voz'}
            title={voiceEnabled ? 'Narração por voz: Ativada' : 'Narração por voz: Desativada'}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 text-[#f5efe6] flex items-center justify-center hover:border-[#d4af37]/50 transition-colors cursor-pointer shrink-0"
          >
            {voiceEnabled ? (
              <Mic className="w-4 h-4 text-[#d4af37]" />
            ) : (
              <MicOff className="w-4 h-4 text-[#b8ab99]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleSound(!soundEnabled)}
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#181411] border border-[#f5efe6]/12 text-[#f5efe6] flex items-center justify-center hover:border-[#d4af37]/50 transition-colors cursor-pointer shrink-0"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#d4af37]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#b8ab99]" />
            )}
          </button>
        </div>
      </div>

      {/* Main Split Stage */}
      <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Hero Emblem, Showcase Card & Story */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <CoguTitleEmblem className="mb-3" />

          <h1
            className="text-2xl sm:text-3xl font-bold text-[#f5efe6] tracking-tight mb-3"
            style={{ fontFamily: "'Fraunces', Georgia, serif", textWrap: 'balance' }}
          >
            A mesa está posta. Puxe uma carta ou vire o copo.
          </h1>

          <p className="text-sm sm:text-base text-[#b8ab99] leading-relaxed max-w-md mb-6">
            Reúna a roda, passe o celular ou jogue na tela grande. Cada carta traz um desafio, regra ou caos — mas a cada puxada o risco de virar o copo cresce.
          </p>

          {/* Interactive 2.5D Hero Card Preview */}
          <div
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              setCardTilt({ rx: (0.5 - y) * 16, ry: (x - 0.5) * 16 });
            }}
            onPointerLeave={() => setCardTilt({ rx: 4, ry: -8 })}
            className="relative w-44 h-64 sm:w-52 sm:h-76 mx-auto lg:mx-0 select-none"
            style={{ perspective: '1000px' }}
          >
            <div
              className="absolute inset-0 rounded-2xl bg-[#d4af37]/20 blur-2xl -z-10"
              aria-hidden="true"
            />
            {/* Secondary fanned card behind */}
            <img
              src={getCardImageUrl(1)}
              alt="Prévia de carta COGU"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover rounded-2xl border border-[#2c241b]/40 shadow-xl opacity-80"
              style={{
                transform: 'translate3d(22px, 8px, -30px) rotateZ(8deg)',
              }}
            />
            {/* Primary Original Back Card 61.png */}
            <img
              src={getCardImageUrl(61)}
              alt="Verso oficial da carta COGU"
              referrerPolicy="no-referrer"
              className="relative w-full h-full object-cover rounded-2xl border border-[#d4af37]/50 shadow-[0_20px_45px_rgba(0,0,0,0.85)] transition-transform duration-200"
              style={{
                transform: `rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
              }}
            />
          </div>
        </div>

        {/* Right Column: Players Setup & Preferences */}
        <div className="lg:col-span-7 bg-[#15120f]/95 border border-[#f5efe6]/12 rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f5efe6]/10">
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-[#f5efe6]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Mesa de Jogadores
              </h2>
              <p className="text-xs text-[#b8ab99] mt-0.5">
                Toque nos nomes para personalizar a ordem da roda
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs font-semibold text-[#d4af37]">
              {players.length} / {MAX_PLAYERS} jogadores
            </span>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1 mb-5">
            {players.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-[#1e1915] border border-[#f5efe6]/10 focus-within:border-[#d4af37]/70 rounded-xl px-3 py-1.5 transition-colors"
              >
                <span className="font-mono tabular-nums text-xs font-bold text-[#d4af37] w-5 text-center shrink-0">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={player}
                  maxLength={22}
                  aria-label={`Nome do Jogador ${index + 1}`}
                  placeholder={`Jogador ${index + 1}`}
                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-[#f5efe6] placeholder-[#b8ab99]/40 focus:outline-none py-1.5"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(index)}
                  disabled={players.length <= MIN_PLAYERS}
                  aria-label={`Remover ${player || `Jogador ${index + 1}`}`}
                  className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#b8ab99] hover:text-[#ef4444] hover:bg-[#ef4444]/10 disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Player & Quick Preferences */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-[#f5efe6]/10">
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={players.length >= MAX_PLAYERS}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#221c17] hover:bg-[#2c241d] border border-[#f5efe6]/15 text-xs font-semibold text-[#f5efe6] flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#d4af37]" />
              <span>Adicionar jogador</span>
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-[#b8ab99] cursor-pointer select-none min-h-[44px]">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => {
                    soundEngine.playClick();
                    onToggleVoice(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
                />
                <Mic className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Narrar cartas por voz</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#b8ab99] cursor-pointer select-none min-h-[44px]">
                <input
                  type="checkbox"
                  checked={confirmDraw}
                  onChange={(e) => {
                    soundEngine.playClick();
                    onToggleConfirmDraw(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
                />
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Confirmar antes de puxar</span>
              </label>
            </div>
          </div>

          {/* Primary Start Game CTA */}
          <button
            type="button"
            data-start="true"
            onClick={() => {
              soundEngine.playFanfare();
              onStartGame();
            }}
            className="w-full min-h-[54px] py-3.5 px-6 rounded-2xl bg-[#d4af37] hover:bg-[#e3be42] active:scale-[0.99] text-[#0d0b0a] font-bold text-base tracking-wide shadow-[0_12px_30px_rgba(212,175,55,0.28)] flex items-center justify-center gap-2.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-5 h-5" />
            <span>Começar Partida</span>
          </button>
        </div>
      </div>

      {/* Footer Clean Inline Control Hint */}
      <div className="text-center text-xs text-[#b8ab99]/75 py-2">
        Toque na carta ou pressione Espaço para puxar · Esc para Pausar · Beba com responsabilidade
      </div>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#181411] border border-[#d4af37]/40 p-6 shadow-2xl">
            <h3
              id="ios-install-title"
              className="text-lg font-bold text-[#f5efe6]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Instalar COGU no iPhone / iPad
            </h3>
            <p className="mt-3 text-sm text-[#b8ab99] leading-relaxed">
              1. Toque no ícone de <strong className="text-[#f5efe6]">Compartilhar</strong> na barra do Safari.
              <br />
              2. Role para baixo e selecione <strong className="text-[#f5efe6]">Adicionar à Tela de Início</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#d4af37] text-[#0d0b0a] font-bold text-sm hover:bg-[#e3be42] transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
