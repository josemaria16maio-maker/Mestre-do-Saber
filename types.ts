export enum GameState {
  LOADING = 'LOADING',
  WELCOME = 'WELCOME',
  PLAYING = 'PLAYING',
  CONFIRMATION = 'CONFIRMATION',
  RESULT_REVEAL = 'RESULT_REVEAL',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum Difficulty {
  EASY = 'Iniciante',
  MEDIUM = 'Intermediário',
  HARD = 'Avançado',
  MASTER = 'Mestre'
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  difficulty: Difficulty;
  id: string;
}

export interface PrizeLevel {
  level: number;
  value: number;
  stopValue: number;
  errorValue: number;
}

export interface Lifelines {
  quantumLeap: number; // Antigo "Pular" -> Salto Quântico
  fiftyFifty: boolean; // Antigo "Cartas" -> 50/50 Binário
  oracleAi: boolean; // Antigo "Universitários" -> Oráculo IA
  globalConsensus: boolean; // Antigo "Platéia" -> Consenso Global
}