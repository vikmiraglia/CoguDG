export interface CardVoiceData {
  id: number;
  title: string;
  phrase: string;
  instruction: string;
  narration: string;
}

/**
 * Verified authorial catalog of all 60 COGU cards, grouped by their 15 design types (4 cards each).
 * The 'narration' field contains the spoken Portuguese text for Web Speech narration.
 */
export const CARD_CATALOG: Record<number, CardVoiceData> = (() => {
  const catalog: Record<number, CardVoiceData> = {};

  const cardDefinitions: {
    range: [number, number];
    title: string;
    phrase: string;
    instruction: string;
    narration: string;
  }[] = [
    {
      range: [1, 4],
      title: 'Hooligans',
      phrase: 'Nós lidamos com chumbo, amigo!',
      instruction: 'Quem for saindo bebe um gole, quem vencer dá um gole a alguém!',
      narration:
        'Hooligans! Nós lidamos com chumbo, amigo! Quem for saindo bebe um gole. Quem vencer dá um gole a alguém!',
    },
    {
      range: [5, 8],
      title: 'Pato Quack!',
      phrase: 'Cinco patinhos foram passear!',
      instruction: 'O primeiro a sair bebe um gole!',
      narration:
        'Pato Quack! Cinco patinhos foram passear! O primeiro a sair bebe um gole!',
    },
    {
      range: [9, 12],
      title: 'Fui à Feira',
      phrase: 'Comprar um gnomo, vinagre e gin!',
      instruction: 'O primeiro a sair bebe dois goles!',
      narration:
        'Fui à feira! Comprar um gnomo, vinagre e gin! O primeiro a sair bebe dois goles!',
    },
    {
      range: [13, 16],
      title: '1 limão, 1/2 limão',
      phrase: 'Cento e dezoito limões, meio limão!',
      instruction: 'O primeiro a sair bebe um gole!',
      narration:
        'Um limão, meio limão! Cento e dezoito limões, meio limão! O primeiro a sair bebe um gole!',
    },
    {
      range: [17, 20],
      title: 'C, S e Composto',
      phrase: 'Praia, água, piscina, cerveja!',
      instruction: 'O primeiro a sair bebe dois goles!',
      narration:
        'C, S e Composto! Praia, água, piscina, cerveja! O primeiro a sair bebe dois goles!',
    },
    {
      range: [21, 24],
      title: 'Os Homens bebem',
      phrase: 'Larguei a bebida... só não lembro onde!',
      instruction: 'O primeiro a sair bebe dois goles!',
      narration:
        'Os homens bebem! Larguei a bebida, só não lembro onde! O primeiro a sair bebe dois goles!',
    },
    {
      range: [25, 28],
      title: 'As Mulheres bebem',
      phrase: 'Uma deusa, uma louca, uma cachaceira, meu Deus ela é demais!',
      instruction: 'Todas as mulheres bebem!',
      narration:
        'As mulheres bebem! Uma deusa, uma louca, uma cachaceira, meu Deus ela é demais! Todas as mulheres bebem!',
    },
    {
      range: [29, 32],
      title: 'Todos Bebem!',
      phrase: 'Lute com toda sua bravura e deixe Odin orgulhoso!',
      instruction: 'Todos na mesa bebem!',
      narration:
        'Todos bebem! Lute com toda sua bravura e deixe Odin orgulhoso! Um brinde coletivo, todos bebem!',
    },
    {
      range: [33, 36],
      title: 'Invente uma Regra!',
      phrase: 'Dê poder ao homem e descobrirá quem ele é!',
      instruction: 'Essa regra expira se uma outra regra for criada.',
      narration:
        'Invente uma Regra! Dê poder ao homem e descobrirá quem ele é! Invente uma regra agora para a roda, válida até outra ser criada!',
    },
    {
      range: [37, 40],
      title: 'Doe um gole!',
      phrase: 'Presente para a roda!',
      instruction: 'Escolha qualquer jogador da mesa para beber um gole.',
      narration:
        'Doe um gole! Escolha qualquer jogador da roda para beber um gole agora!',
    },
    {
      range: [41, 44],
      title: 'Doe dois goles!',
      phrase: 'Amor compartilhado!',
      instruction: 'Escolha um ou dois jogadores para beber dois goles.',
      narration:
        'Doe dois goles! Distribua dois goles para quem você quiser na mesa!',
    },
    {
      range: [45, 48],
      title: 'Doe três goles!',
      phrase: 'Cavalo de Troia!',
      instruction: 'Distribua três goles entre os jogadores da mesa.',
      narration:
        'Doe três goles! Presente grego: distribua três goles para a roda!',
    },
    {
      range: [49, 52],
      title: 'Beba um gole!',
      phrase: 'O crânio te convoca!',
      instruction: 'Você deve beber um gole imediatamente.',
      narration:
        'Beba um gole! Sem choro: você deve beber um gole agora!',
    },
    {
      range: [53, 56],
      title: 'Beba dois goles!',
      phrase: 'Dois crânios na sua frente!',
      instruction: 'Você deve beber dois goles imediatamente.',
      narration:
        'Beba dois goles! A sorte não ajudou: beba dois goles imediatamente!',
    },
    {
      range: [57, 60],
      title: 'Beba três goles!',
      phrase: 'O grito da caveira!',
      instruction: 'Você deve beber três goles imediatamente.',
      narration:
        'Beba três goles! O crânio abriu a boca: beba três goles sem reclamar!',
    },
  ];

  for (const def of cardDefinitions) {
    const [start, end] = def.range;
    for (let id = start; id <= end; id++) {
      catalog[id] = {
        id,
        title: def.title,
        phrase: def.phrase,
        instruction: def.instruction,
        narration: def.narration,
      };
    }
  }

  return catalog;
})();

export function getCardVoiceData(cardId: number | null): CardVoiceData | null {
  if (!cardId || !CARD_CATALOG[cardId]) return null;
  return CARD_CATALOG[cardId];
}
