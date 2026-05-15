import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'PLACEHOLDER_KEY');

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  image?: string;
}

export async function generateResponse(
  messages: ChatMessage[], 
  systemInstruction?: string, 
  maxTokens?: number
) {
  const models = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  
  for (const modelName of models) {
    try {
      console.log(`Attempting Gemini call with model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction,
      });
      
      // Map our message format to Gemini's format
      const contents = messages.map(msg => {
        const parts: any[] = [{ text: msg.content }];
        
        if (msg.image) {
          const mimeType = msg.image.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
          const base64Data = msg.image.split(',')[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
        
        return {
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: parts
        };
      });

      const result = await model.generateContent({
        contents: contents,
        generationConfig: maxTokens ? { maxOutputTokens: maxTokens } : undefined,
      });
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error(`Failed with model ${modelName}:`, error);
      
      if (modelName === models[models.length - 1]) {
        throw error;
      }
    }
  }
}

export async function generateQuiz(topic: string, count: number = 3, level: string = 'Intermediate') {
  const modelName = 'gemini-2.5-flash-lite';
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "You are an AI Mentor. Generate a quiz based on the requested topic. Return ONLY a JSON array of questions.",
    });
    
    const prompt = `Generate a quiz on the topic: "${topic}".
    The difficulty level must be: "${level}".
    The quiz must contain exactly ${count} questions.
    Mix ONLY these two types: 'mcq' (Multiple Choice) and 'fill_in_the_blank'.
    Do NOT generate 'short_answer' questions.
    For 'fill_in_the_blank', ensure the answer is a single specific word or short phrase (like a number or name) that can be easily matched.
    
    Return the response as a JSON array matching this TypeScript interface:
    interface QuizQuestion {
      type: 'mcq' | 'fill_in_the_blank';
      question: string;
      options?: string[]; // Required for mcq!
      answer: string; // The correct answer.
      explanation: string; // Why this answer is correct.
    }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    throw error;
  }
}

export async function gradeAnswer(question: string, expectedAnswer: string, userAnswer: string) {
  const modelName = 'gemini-2.5-flash-lite';
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "You are an AI Mentor grading a quiz. Determine if the user's answer is correct based on the question and expected answer. Be lenient with formatting, units, and synonyms.",
    });
    
    const prompt = `Question: "${question}"
    Expected Answer: "${expectedAnswer}"
    User Answer: "${userAnswer}"
    
    Return the response as a JSON object matching this TypeScript interface:
    interface GradeResponse {
      correct: boolean;
      explanation: string; // Brief explanation of why it's correct or incorrect, and what the correct answer is if incorrect.
    }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to grade answer:", error);
    throw error;
  }
}

export async function generateAICGreeting(stats: { streak: number, level: number, xp: number, mistakes: number }) {
  const modelName = 'gemini-2.5-flash-lite';
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "You are Eous, a powerful and supportive AI Mentor. Generate a short, personalized welcome message for the user based on their stats.",
    });
    
    const prompt = `The user just opened the app. Here are their current stats:
    - Streak: ${stats.streak} days
    - Level: ${stats.level}
    - XP: ${stats.xp}/100
    - Wrong Questions to practice: ${stats.mistakes}
    
    Generate a short, encouraging welcome message (max 2-3 sentences). 
    Acknowledge their streak or level if they are good, and suggest what they should do next (e.g. practice mistakes if they have any, or continue learning).
    Keep it friendly and professional.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Failed to generate greeting:", error);
    return `Welcome back! You are on a ${stats.streak} day streak. You have ${stats.mistakes} mistakes to practice. Let's keep learning!`;
  }
}

export async function checkContentSafety(text: string): Promise<{ isSafe: boolean; reason?: string }> {
  const modelName = 'gemini-2.5-flash-lite';
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "You are an AI Mentor. Analyze the text for spam or inappropriate content.",
    });
    
    const prompt = `Analyze the following text from a user in an educational chat app. 
Check for:
1. Spam or gibberish.
2. Hate speech, harassment, or profanity.
3. Sexually explicit content.
4. Promotion of violence or illegal activities.

If the text is unsafe or inappropriate, respond with "UNSAFE: <reason>".
If the text is safe and appropriate, respond with "SAFE".

Text to analyze:
"${text}"`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const response = await result.response;
    const textResult = response.text().trim();
    
    if (textResult.startsWith('UNSAFE')) {
      return { isSafe: false, reason: textResult.replace('UNSAFE:', '').trim() };
    }
    return { isSafe: true };
  } catch (error) {
    console.error("Safety check failed:", error);
    return { isSafe: true }; // Fail open!
  }
}
