import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty, QuizConfig, QuestionType } from "../types";

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateQuestionsFromText = async (
  text: string,
  config: QuizConfig
): Promise<Question[]> => {
  const ai = getAi();
  
  const difficultyNote = config.difficulty === Difficulty.HARD 
    ? "FOR HARD DIFFICULTY: Generate extremely challenging distractors. Options must be conceptually very close and subtle to differentiate."
    : `Difficulty level: ${config.difficulty}.`;

  const prompt = `
    Analyze the following text and generate an interactive quiz.
    TEXT: """${text}"""
    
    STRICT REQUIREMENTS:
    1. Generate exactly ${config.numMcq} Multiple Choice Questions (MCQ).
       - Each MCQ must have exactly 4 "options" (array of strings).
       - Each MCQ must have a "correctIndex" (0, 1, 2, or 3) pointing to the correct option.
       - Set "correctAnswer" to null.
    2. Generate exactly ${config.numTf} True/False (T/F) questions.
       - Each T/F must have a "correctAnswer" (boolean: true or false).
       - Set "options" to null and "correctIndex" to null.
    3. Use the following "type" labels: "MCQ" for Multiple Choice and "TRUE_FALSE" for True/False.
    4. ${difficultyNote}
    5. Language: ${config.language === 'ar' ? 'Arabic' : 'English'}.
    6. All content must be based on the provided text.
    7. Return only a valid JSON array.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { 
          type: Type.STRING, 
          description: "Must be exactly 'MCQ' or 'TRUE_FALSE'" 
        },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Required for MCQ, list of 4 choices. Null for TRUE_FALSE."
        },
        correctIndex: { 
          type: Type.NUMBER,
          description: "The index (0-3) of the correct answer in the options array. Required for MCQ."
        },
        correctAnswer: { 
          type: Type.BOOLEAN,
          description: "The correct boolean value. Required for TRUE_FALSE."
        },
        explanation: { type: Type.STRING },
        difficulty: { type: Type.STRING }
      },
      required: ["type", "question", "explanation"]
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });

  try {
    const rawText = response.text || "[]";
    const parsed = JSON.parse(rawText);
    
    return parsed.map((q: any, i: number) => {
      // Robust type detection
      const type = (q.type === 'TRUE_FALSE' || typeof q.correctAnswer === 'boolean') 
        ? QuestionType.TRUE_FALSE 
        : QuestionType.MCQ;

      return {
        id: `q-${i}-${Date.now()}`,
        type: type,
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: config.difficulty
      };
    });
  } catch (e) {
    console.error("Parsing error:", e);
    return [];
  }
};

export const extractTextFromImage = async (base64Image: string, language: 'ar' | 'en'): Promise<string> => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [
        { text: "Extract all text from this image exactly. If it's a educational document, maintain its structure." },
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } }
      ]
    }
  });
  return response.text || "";
};