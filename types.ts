
export enum GenerationModel {
  FLASH = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}

export interface TransformationResult {
  id: string;
  originalImage: string;
  transformedImage: string;
  prompt: string;
  timestamp: number;
}

export interface GeminiResponsePart {
  inlineData?: {
    mimeType: string;
    data: string;
  };
  text?: string;
}

export interface AppState {
  isGenerating: boolean;
  error: string | null;
  history: TransformationResult[];
}
