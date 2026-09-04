/**
 * PawConnect India – Client-Side Animal Validation Proxy (NGO Client)
 * Calls the backend /api/dogs/validate-animal endpoint with auto-compressed preview payload.
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

export function fileToDataUrl(file: File, maxDim: number = 800): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.onerror = () => resolve("");
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
