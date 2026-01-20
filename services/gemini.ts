
import { GoogleGenAI } from "@google/genai";
import { GenerationModel, GeminiResponsePart } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const transformImage = async (
  base64Image: string,
  prompt: string,
  model: GenerationModel = GenerationModel.FLASH
): Promise<string> => {
  // Always create a new instance to ensure we pick up the latest API key if it was updated via aistudio.openSelectKey
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming png/jpeg source
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          ...(model === GenerationModel.PRO ? { imageSize: "2K" } : {})
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const parts = response.candidates[0].content.parts as GeminiResponsePart[];
    const imagePart = parts.find(part => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error("Gemini returned text but no image part.");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Specific check for API key issues as per instructions
    if (error.message?.includes("Requested entity was not found.")) {
      throw new Error("API_KEY_INVALID");
    }
    
    throw error;
  }
};
