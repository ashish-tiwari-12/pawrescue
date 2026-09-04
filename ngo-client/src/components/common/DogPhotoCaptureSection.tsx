import React, { useState, useRef } from "react";
import { LiveWebcamModal } from "./LiveWebcamModal";
import { api } from "../../api/client";

interface Props {
  selectedFiles: File[];
  previewUrls: string[];
  onFilesChange: (files: File[], urls: string[]) => void;
  onPhotoCapturedAutoGps?: () => void;
  locationCaptured?: boolean;
  coordinatesText?: string;
  maxFiles?: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const DogPhotoCaptureSection: React.FC<Props> = ({
  selectedFiles,
  previewUrls,
  onFilesChange,
  onPhotoCapturedAutoGps,
  locationCaptured = false,
  coordinatesText,
  maxFiles = 5
}) => {
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeRetakeIndex, setActiveRetakeIndex] = useState<number | null>(null);
  const [validatingMap, setValidatingMap] = useState<Record<number, boolean>>({});
  const [aiStatusMap, setAiStatusMap] = useState<Record<number, { valid: boolean; message: string; animal?: string }>>({});

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runAiValidationOnFile = async (file: File, index: number) => {
    setValidatingMap((prev) => ({ ...prev, [index]: true }));
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.validateAnimalImage({
        imageUrl: dataUrl,
        title: file.name
      });

      if (res.validAnimal && res.animalType) {
        const emoji = res.animalType === "dog" ? "🐶" : res.animalType === "cat" ? "🐱" : "🐮";
        const label = res.animalType.charAt(0).toUpperCase() + res.animalType.slice(1);
        setAiStatusMap((prev) => ({
          ...prev,
          [index]: {
            valid: true,
            animal: res.animalType,
            message: `${emoji} Verified ${label} (${Math.round((res.confidence || 0.9) * 100)}% Match)`
          }
        }));
      } else {
        const errMsg = res.error || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.";
        setAiStatusMap((prev) => ({
          ...prev,
          [index]: {
            valid: false,
            message: errMsg
          }
        }));
        setValidationError(errMsg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Please upload a clear image of a Dog, Cat, or Cow.";
      setAiStatusMap((prev) => ({
        ...prev,
        [index]: {
          valid: false,
          message: errMsg
        }
      }));
      setValidationError(errMsg);
    } finally {
      setValidatingMap((prev) => ({ ...prev, [index]: false }));
    }
  };

  const processNewFiles = async (newFiles: File[], replaceIndex?: number | null) => {
    setValidationError(null);

    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        setValidationError(`"${file.name}" is not supported. Please upload JPG, PNG, or WEBP images.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(`"${file.name}" exceeds the 10MB limit (${formatFileSize(file.size)}). Please select a smaller photo.`);
        return;
      }

      const lowerName = file.name.toLowerCase();
      const forbiddenWords = ["selfie", "human", "person", "me", "face", "portrait", "boy", "girl", "avatar", "car", "bike", "building"];
      if (forbiddenWords.some((w) => lowerName.includes(w))) {
        setValidationError("Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.");
        return;
      }

      validFiles.push(file);
    }

    let updatedFiles: File[] = [];
    let updatedUrls: string[] = [];
    const newIndices: number[] = [];

    if (typeof replaceIndex === "number" && replaceIndex >= 0) {
      updatedFiles = [...selectedFiles];
      updatedUrls = [...previewUrls];
      if (validFiles[0]) {
        updatedFiles[replaceIndex] = validFiles[0];
        updatedUrls[replaceIndex] = URL.createObjectURL(validFiles[0]);
        newIndices.push(replaceIndex);
      }
    } else {
      const totalAllowed = maxFiles - selectedFiles.length;
      if (totalAllowed <= 0) {
        setValidationError(`Maximum ${maxFiles} photos allowed per dog profile.`);
        return;
      }

      const filesToAdd = validFiles.slice(0, totalAllowed);
      if (validFiles.length > totalAllowed) {
        setValidationError(`Only ${totalAllowed} more photo(s) could be added (max ${maxFiles}).`);
      }

      const startIdx = selectedFiles.length;
      filesToAdd.forEach((_, i) => newIndices.push(startIdx + i));

      updatedFiles = [...selectedFiles, ...filesToAdd];
      const newUrls = filesToAdd.map((file) => URL.createObjectURL(file));
      updatedUrls = [...previewUrls, ...newUrls];
    }

    onFilesChange(updatedFiles, updatedUrls);

    if (onPhotoCapturedAutoGps) {
      onPhotoCapturedAutoGps();
    }

    newIndices.forEach((idx) => {
      const fileToValidate = updatedFiles[idx];
      if (fileToValidate) {
        runAiValidationOnFile(fileToValidate, idx);
      }
    });
  };

  const handleMobileCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processNewFiles(files, activeRetakeIndex);
      setActiveRetakeIndex(null);
    }
    e.target.value = "";
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processNewFiles(files, activeRetakeIndex);
      setActiveRetakeIndex(null);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    onFilesChange(updatedFiles, updatedUrls);

    setAiStatusMap((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setValidatingMap((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setValidationError(null);
  };

  const handleRetakeImage = (index: number) => {
    setActiveRetakeIndex(index);
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice && mobileCameraInputRef.current) {
      mobileCameraInputRef.current.click();
    } else {
      setIsWebcamOpen(true);
    }
  };

  const handleLiveCameraClick = () => {
    setActiveRetakeIndex(null);
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobileDevice && mobileCameraInputRef.current) {
      mobileCameraInputRef.current.click();
    } else {
      setIsWebcamOpen(true);
    }
  };

  const handleWebcamPhotoCaptured = (file: File) => {
    processNewFiles([file], activeRetakeIndex);
    setActiveRetakeIndex(null);
  };

  return (
    <div className="space-y-3.5">
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        onChange={handleMobileCameraCapture}
        className="hidden"
        id="ngo-camera-capture-input"
      />

      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleGallerySelect}
        className="hidden"
        id="ngo-gallery-upload-input"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span>Animal Photos (Dog, Cat, Cow)</span>
          <span className="text-[11px] font-normal text-slate-400">
            ({selectedFiles.length}/{maxFiles} attached)
          </span>
        </label>

        {locationCaptured && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-full text-[10px] font-bold animate-fadeIn">
            <span className="material-symbols-outlined !text-xs text-emerald-400">my_location</span>
            <span>📍 Current Location Captured</span>
          </div>
        )}
      </div>

      {validationError && (
        <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined !text-base text-red-400 shrink-0">error</span>
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleLiveCameraClick}
          disabled={selectedFiles.length >= maxFiles}
          className="h-14 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-slate-950 rounded-2xl font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center">
            <span className="material-symbols-outlined !text-xl text-slate-950">photo_camera</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-black leading-tight">📷 Capture Live Photo</div>
            <div className="text-[10px] font-normal text-slate-900">Rear Camera / Webcam</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles}
          className="h-14 px-4 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 active:scale-[0.98] text-slate-200 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center">
            <span className="material-symbols-outlined !text-xl">photo_library</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-tight">🖼 Upload From Gallery</div>
            <div className="text-[10px] font-normal text-slate-400">Dog, Cat, or Cow image</div>
          </div>
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Attached Photos & AI Validation Status
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => {
              const aiStatus = aiStatusMap[idx];
              const isValidating = validatingMap[idx];

              return (
                <div
                  key={idx}
                  className={`relative p-2.5 rounded-2xl border shadow-sm flex items-center gap-3 animate-fadeIn ${
                    aiStatus && !aiStatus.valid
                      ? "bg-red-950/40 border-red-800/60"
                      : aiStatus && aiStatus.valid
                      ? "bg-emerald-950/30 border-emerald-700/60"
                      : "bg-slate-800/90 border-slate-700"
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 relative">
                    <img
                      src={previewUrls[idx]}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {aiStatus && !aiStatus.valid && (
                      <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-red-200 text-base font-bold">
                        ✕
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {file.name || `Photo #${idx + 1}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "JPG"}
                    </div>

                    <div className="mt-1">
                      {isValidating ? (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          <span className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          <span>AI Validating...</span>
                        </div>
                      ) : aiStatus ? (
                        aiStatus.valid ? (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md">
                            <span>{aiStatus.message}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-md">
                            <span>❌ Not Dog/Cat/Cow</span>
                          </div>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                          <span>Ready</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRetakeImage(idx)}
                      className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined !text-xs">refresh</span>
                      <span>Retake</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <LiveWebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onPhotoCaptured={handleWebcamPhotoCaptured}
      />
    </div>
  );
};
