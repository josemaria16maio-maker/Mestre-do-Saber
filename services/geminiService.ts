import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Difficulty, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Exatamente 4 opções de resposta."
          },
          correctAnswerIndex: { 
            type: Type.INTEGER,
            description: "Índice da resposta correta (0-3)."
          }
        },
        required: ["questionText", "options", "correctAnswerIndex"]
      }
    }
  }
};

export const generateQuestions = async (): Promise<Question[]> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Gere 16 perguntas de conhecimentos gerais desafiadoras para um jogo de quiz de alto nível (estilo trivia acadêmico).
      
      Estrutura de Dificuldade:
      - 5 perguntas nível Iniciante (Fatos comuns, cultura pop, geografia básica)
      - 5 perguntas nível Intermediário (História, literatura, ciência)
      - 5 perguntas nível Avançado (Detalhes específicos, física, geopolítica)
      - 1 pergunta nível Mestre (Curiosidade extremamente rara ou complexa)
      
      Idioma: Português do Brasil.
      As perguntas devem ser objetivas e claras. Evite perguntas com "Nenhuma das anteriores".
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.8
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Falha na geração de perguntas");

    const parsed = JSON.parse(jsonText);
    const rawQuestions = parsed.questions;

    return rawQuestions.map((q: any, index: number) => {
      let diff = Difficulty.EASY;
      if (index >= 5) diff = Difficulty.MEDIUM;
      if (index >= 10) diff = Difficulty.HARD;
      if (index === 15) diff = Difficulty.MASTER;

      return {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        difficulty: diff
      };
    });

  } catch (error) {
    console.error("Erro ao gerar perguntas:", error);
    return getFallbackQuestions();
  }
};

const getFallbackQuestions = (): Question[] => {
  // Perguntas genéricas de backup
  return [
    {
      id: 'bk1',
      questionText: "Qual é o símbolo químico da água?",
      options: ["H2O", "O2", "CO2", "HO"],
      correctAnswerIndex: 0,
      difficulty: Difficulty.EASY
    },
    // ... preencher com 16 placeholders se necessário para o fluxo funcionar
    ...Array(15).fill(null).map((_, i) => ({
        id: `bk-${i+2}`,
        questionText: `Pergunta de reserva #${i+2}. Conexão offline. A resposta é A.`,
        options: ["Resposta A", "Resposta B", "Resposta C", "Resposta D"],
        correctAnswerIndex: 0,
        difficulty: i > 13 ? Difficulty.MASTER : Difficulty.EASY
    }))
  ];
}