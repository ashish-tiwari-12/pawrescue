/**
 * PawConnect India – Client-Side Animal Validation Proxy
 * Calls the backend /api/dogs/validate-animal endpoint directly.
 */

import { api } from "../api/client";

export interface ClientValidationResult {
  validAnimal: boolean;
  animalDetected: boolean;
  animalType?: "dog" | "cat" | "cow";
  detectedClasses: string[];
  confidenceScores: number[];
  confidence: number;
  error?: string;
  breed?: string;
  color?: string;
  ageGroup?: string;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function validateImageInBrowser(
  fileOrDataUrl: File | string,
  context?: { title?: string; description?: string; category?: string }
): Promise<ClientValidationResult> {
  try {
    let dataUrl: string;
    let fileName = "";

    if (typeof fileOrDataUrl === "string") {
      dataUrl = fileOrDataUrl;
    } else {
      fileName = fileOrDataUrl.name;
      dataUrl = await fileToDataUrl(fileOrDataUrl);
    }

    const res = await api.validateAnimalImage({
      imageUrl: dataUrl,
      title: `${context?.title || ""} ${fileName}`.trim(),
      description: context?.description,
      category: context?.category
    });

    return {
      validAnimal: res.validAnimal,
      animalDetected: (res as any).animalDetected !== undefined ? (res as any).animalDetected : res.validAnimal,
      animalType: res.animalType,
      detectedClasses: (res as any).detectedClasses || (res.animalType ? [res.animalType] : []),
      confidenceScores: (res as any).confidenceScores || [res.confidence || 0.9],
      confidence: res.confidence || 0.9,
      breed: res.breed,
      color: res.color,
      ageGroup: res.ageGroup,
      error: res.error
    };
  } catch (err: any) {
    const data = err.response?.data;
    return {
      validAnimal: false,
      animalDetected: false,
      detectedClasses: data?.detectedClasses || ["unsupported"],
      confidenceScores: data?.confidenceScores || [0],
      confidence: 0,
      error: data?.error || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal."
    };
  }
}
