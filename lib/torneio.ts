// Config central do torneio
export const TORNEIO = {
  nome: "Super 8 BT Delas",
  data: "Domingo, 13 de dezembro de 2026",
  localCurto: "Maceió/AL",
  abertura: new Date("2026-11-10T12:00:00-03:00"),
  vagas: { C: 24, D: 16 },
  gruposPorCat: { C: 3, D: 2 },
  tamGrupo: 8,
};

// Template Super 8 — 7 rodadas, cada jogadora faz dupla 1x com cada uma das outras 7
export const TEMPLATE: number[][][][] = [
  [[[1, 2], [3, 4]], [[5, 6], [7, 8]]],
  [[[1, 3], [2, 4]], [[5, 7], [6, 8]]],
  [[[1, 4], [2, 3]], [[5, 8], [6, 7]]],
  [[[1, 5], [2, 6]], [[3, 7], [4, 8]]],
  [[[1, 6], [2, 5]], [[3, 8], [4, 7]]],
  [[[1, 7], [2, 8]], [[3, 5], [4, 6]]],
  [[[1, 8], [2, 7]], [[3, 6], [4, 5]]],
];
