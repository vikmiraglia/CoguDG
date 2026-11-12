import React from 'react';
import { HistoryItem, getCardImageUrl } from '../game/rules';
import { X, Beer, Sparkles, RotateCcw, Users, Play } from 'lucide-react';
import { soundEngine } from '../game/audio';

export const RulesDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#16120f] border border-[#d4af37]/35 p-6 sm:p-8 shadow-2xl text-[#f5efe6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#f5efe6]/10">
          <h2
            id="rules-modal-title"
            className="text-xl sm:text-2xl font-bold"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Como Jogar COGU
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Fechar regras"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#221c17] hover:bg-[#2c241d] flex items-center justify-center text-[#b8ab99] hover:text-[#f5efe6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="space-y-3.5 text-sm sm:text-base text-[#dcd2c4] leading-relaxed">
          <li>
            <strong className="text-[#d4af37] font-mono mr-2">01.</strong>
            O jogador da vez toca no baralho ou em <strong className="text-[#f5efe6]">Puxar Carta</strong>.
          </li>
          <li>
            <strong className="text-[#d4af37] font-mono mr-2">02.</strong>
            Se sobreviver ao risco, leia a carta em voz alta para o grupo e cumpra o desafio, regra ou dinâmica.
          </li>
          <li>
            <strong className="text-[#d4af37] font-mono mr-2">03.</strong>
            Concluída a carta, toque em <strong className="text-[#f5efe6]">Próximo Jogador</strong> e passe a vez.
          </li>
          <li>
            <strong className="text-[#d4af37] font-mono mr-2">04.</strong>
            <strong className="text-[#ef4444]">O Risco do Copo:</strong> Nas 10 primeiras cartas, a chance de perder é de{' '}
            <strong className="text-[#f5efe6] font-mono">1%</strong>. A partir da 11ª carta, a tensão sobe progressivamente até{' '}
            <strong className="text-[#f5efe6] font-mono">5%</strong> na última carta.
          </li>
          <li>
            <strong className="text-[#d4af37] font-mono mr-2">05.</strong>
            Quando a sorte falhar, o alarme dispara: <strong className="text-[#ef4444]">“Você perdeu! Vire o Copo”</strong> — e uma nova rodada recomeça com o baralho embaralhado.
          </li>
        </ol>

        <div className="mt-6 pt-4 border-t border-[#f5efe6]/10 flex items-center justify-between text-xs text-[#b8ab99]">
          <span>Divirta-se entre amigos · Beba com responsabilidade</span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#d4af37] text-[#0d0b0a] font-bold hover:bg-[#e3be42] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const HistoryDialog: React.FC<{
  open: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onSelectCard?: (cardId: number) => void;
}> = ({ open, history, onClose, onSelectCard }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[82vh] flex flex-col rounded-3xl bg-[#16120f] border border-[#d4af37]/35 p-6 shadow-2xl text-[#f5efe6]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f5efe6]/10 shrink-0">
          <div>
            <h2
              id="history-modal-title"
              className="text-xl font-bold"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Cartas na Mesa
            </h2>
            <p className="text-xs text-[#b8ab99] mt-0.5">
              Histórico de cartas puxadas nesta partida ({history.length})
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Fechar histórico"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#221c17] hover:bg-[#2c241d] flex items-center justify-center text-[#b8ab99] hover:text-[#f5efe6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#b8ab99]">
              Nenhuma carta foi puxada nesta rodada ainda.
            </div>
          ) : (
            history.map((item) => (
              <button
                key={`${item.drawNumber}-${item.card}`}
                type="button"
                onClick={() => {
                  if (onSelectCard) {
                    soundEngine.playClick();
                    onSelectCard(item.card);
                  }
                }}
                className="w-full flex items-center justify-between gap-3.5 p-2.5 rounded-2xl bg-[#1f1a15] hover:bg-[#28211b] border border-[#f5efe6]/8 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={getCardImageUrl(item.card)}
                    alt={`Carta ${item.card}`}
                    referrerPolicy="no-referrer"
                    className="w-11 h-16 object-cover rounded-lg border border-[#d4af37]/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#f5efe6] truncate">
                      {item.player}
                    </p>
                    <p className="text-xs text-[#b8ab99] mt-0.5">
                      Carta #{item.card} · {item.drawNumber}ª puxada
                    </p>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#d4af37] shrink-0 pr-2">
                  Risco {item.risk}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const PauseDialog: React.FC<{
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onBackToSetup: () => void;
}> = ({ open, onResume, onRestart, onBackToSetup }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#16120f] border border-[#d4af37]/40 p-6 sm:p-7 shadow-2xl text-center">
        <h2
          id="pause-modal-title"
          className="text-2xl font-bold text-[#f5efe6]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Jogo Pausado
        </h2>
        <p className="text-xs text-[#b8ab99] mt-1 mb-6">
          Respire fundo, encha o copo ou ajuste a roda de jogadores.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full min-h-[48px] rounded-xl bg-[#d4af37] hover:bg-[#e3be42] text-[#0d0b0a] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continuar Partida</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playFanfare();
              onRestart();
            }}
            className="w-full min-h-[48px] rounded-xl bg-[#221c17] hover:bg-[#2c241d] border border-[#f5efe6]/15 text-[#f5efe6] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#d4af37]" />
            <span>Reembaralhar do Zero</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToSetup();
            }}
            className="w-full min-h-[48px] rounded-xl bg-transparent hover:bg-[#f5efe6]/5 text-[#b8ab99] hover:text-[#f5efe6] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Editar Jogadores</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmDrawDialog: React.FC<{
  open: boolean;
  playerName: string;
  riskPercent: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, playerName, riskPercent, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-draw-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#16120f] border border-[#d4af37]/40 p-6 shadow-2xl text-center">
        <h3
          id="confirm-draw-title"
          className="text-xl font-bold text-[#f5efe6]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Confirmar Puxada?
        </h3>
        <p className="text-sm text-[#b8ab99] mt-2 leading-relaxed">
          É a vez de <strong className="text-[#f5efe6]">{playerName}</strong>. O risco atual de virar o copo é de{' '}
          <strong className="text-[#d4af37] font-mono">{riskPercent}</strong>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onCancel();
            }}
            className="min-h-[46px] rounded-xl bg-[#221c17] hover:bg-[#2c241d] text-xs font-semibold text-[#b8ab99] hover:text-[#f5efe6] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[46px] rounded-xl bg-[#d4af37] hover:bg-[#e3be42] text-xs font-bold text-[#0d0b0a] transition-colors cursor-pointer"
          >
            Puxar Carta
          </button>
        </div>
      </div>
    </div>
  );
};

export const CardZoomLightbox: React.FC<{
  cardId: number | null;
  onClose: () => void;
}> = ({ cardId, onClose }) => {
  if (!cardId) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada da carta ${cardId}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 cursor-zoom-out"
    >
      <img
        src={getCardImageUrl(cardId)}
        alt={`Carta ${cardId} ampliada`}
        referrerPolicy="no-referrer"
        className="max-h-[82vh] max-w-[92vw] w-auto h-auto rounded-2xl border border-[#d4af37]/50 shadow-[0_25px_70px_rgba(0,0,0,0.95)] object-contain"
      />
      <p className="mt-4 text-xs text-[#b8ab99]">Toque em qualquer lugar para fechar</p>
    </div>
  );
};

export const GameOverModal: React.FC<{
  open: boolean;
  outcome: 'none' | 'loss' | 'deck_cleared';
  loserName: string | null;
  loserDrawNumber: number | null;
  drawnCount: number;
  roundNumber: number;
  riskAtEnd: string;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}> = ({
  open,
  outcome,
  loserName,
  loserDrawNumber,
  drawnCount,
  roundNumber,
  riskAtEnd,
  onPlayAgain,
  onBackToSetup,
}) => {
  if (!open || outcome === 'none') return null;

  const isLoss = outcome === 'loss';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-center border ${
          isLoss
            ? 'bg-[#1a0b0b] border-[#ef4444]/60 shadow-[0_0_70px_rgba(220,38,38,0.35)]'
            : 'bg-[#16120f] border-[#d4af37]/60 shadow-[0_0_60px_rgba(212,175,55,0.28)]'
        }`}
      >
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
            isLoss
              ? 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]'
              : 'bg-[#d4af37]/15 border-[#d4af37]/40 text-[#d4af37]'
          }`}
        >
          {isLoss ? <Beer className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
        </div>

        <p className="text-xs font-semibold tracking-widest uppercase text-[#b8ab99]">
          {isLoss ? 'A Sorte Acabou' : 'Baralho Conquistado'}
        </p>

        <h1
          id="gameover-title"
          className="mt-1 text-3xl sm:text-4xl font-black text-[#f5efe6] leading-tight"
          style={{ fontFamily: "'Fraunces', Georgia, serif", textWrap: 'balance' }}
        >
          {isLoss ? (
            <>
              Você perdeu!
              <br />
              <span className="text-[#ef4444]">Vire o Copo</span>
            </>
          ) : (
            <>
              60 Cartas!
              <br />
              <span className="text-[#d4af37]">Mesa Lendária</span>
            </>
          )}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#dcd2c4]">
          {isLoss
            ? `${loserName} puxou a ${loserDrawNumber}ª carta e caiu na maldição do COGU.`
            : 'Inacreditável! Todos sobreviveram às 60 cartas sem derrubar o copo.'}
        </p>

        {/* 3 Tabular Stat Tiles */}
        <div className="my-6 grid grid-cols-3 gap-2.5 bg-[#0d0b0a]/70 p-3.5 rounded-2xl border border-[#f5efe6]/10">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#b8ab99]">
              Puxadas
            </span>
            <strong className="mt-0.5 block font-mono tabular-nums text-lg font-bold text-[#f5efe6]">
              {drawnCount} / 60
            </strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#b8ab99]">
              Rodadas
            </span>
            <strong className="mt-0.5 block font-mono tabular-nums text-lg font-bold text-[#f5efe6]">
              {roundNumber}
            </strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#b8ab99]">
              Risco Final
            </span>
            <strong
              className={`mt-0.5 block font-mono tabular-nums text-lg font-bold ${
                isLoss ? 'text-[#ef4444]' : 'text-[#d4af37]'
              }`}
            >
              {riskAtEnd}
            </strong>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              soundEngine.playFanfare();
              onPlayAgain();
            }}
            className={`w-full min-h-[52px] rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLoss
                ? 'bg-[#ef4444] hover:bg-[#f87171] text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)]'
                : 'bg-[#d4af37] hover:bg-[#e3be42] text-[#0d0b0a] shadow-[0_12px_30px_rgba(212,175,55,0.3)]'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span>Nova Rodada</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToSetup();
            }}
            className="w-full min-h-[46px] rounded-xl bg-transparent hover:bg-[#f5efe6]/8 text-xs font-semibold text-[#b8ab99] hover:text-[#f5efe6] transition-colors cursor-pointer"
          >
            Voltar para Jogadores
          </button>
        </div>
      </div>
    </div>
  );
};
