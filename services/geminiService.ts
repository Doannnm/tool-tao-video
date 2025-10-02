
import { GoogleGenAI } from "@google/genai";
import { Job, InputType } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume it's set.
    console.warn("API_KEY environment variable not set. Using a placeholder.");
    process.env.API_KEY = "YOUR_API_KEY_HERE";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the data:mime/type;base64, part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const generateVideoFromJob = async (job: Job): Promise<Blob> => {
    const { prompt, model, numberOfOutputs, inputType, imageFile, aspectRatio } = job;

    let imagePayload;
    if (inputType === InputType.ImageToVideo && imageFile) {
        const base64Image = await fileToBase64(imageFile);
        imagePayload = {
            imageBytes: base64Image,
            mimeType: imageFile.type,
        };
    }
    
    // The model name in the Gemini API might differ from user-facing names.
    // Here we map it. For this example, we'll assume the names match.
    const apiModel = model === 'veo-3.0-fast-preview' ? 'veo-2.0-generate-001' : model;

    let operation = await ai.models.generateVideos({
        model: apiModel,
        prompt: prompt,
        image: imagePayload,
        config: {
            numberOfVideos: numberOfOutputs,
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        // Poll every 10 seconds. In a real app, you might want more sophisticated logic.
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    return await response.blob();
};
