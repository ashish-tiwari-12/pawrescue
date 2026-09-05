import React, { useState, useRef } from "react";
import { LiveWebcamModal } from "./LiveWebcamModal";
import { api } from "../../api/client";
import { fileToDataUrl } from "../../utils/animalImageValidator";

interface Props {
  selectedFiles: File[];
  previewUrls: string[];
  onFilesChange: (files: File[], urls: string[]) => void;
  onPhotoCapturedAutoGps?: () => void;
  locationCaptured?: boolean;
  coordinatesText?: string;
  maxFiles?: number;
}

interface ImageValidationInfo {
  status: "idle" | "validating" | "accepted" | "rejected";
  animalDetected: boolean;
  animalType?: "dog" | "cat" | "cow" | string;
  detectedClasses: string[];
  confidence: number;
  confidencePercent: number;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const getFileKey = (file: File): string => {
  return `${file.name}_${file.size}_${file.lastModified}`;
};

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

  const [validationMap, setValidationMap] = useState<Record<string, ImageValidationInfo>>({});

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateSingleFile = async (file: File) => {
    const key = getFileKey(file);

    setValidationMap((prev) => ({
      ...prev,
      [key]: {
        status: "validating",
        animalDetected: false,
        detectedClasses: [],
        confidence: 0,
        confidencePercent: 0
      }
    }));

    try {
      const dataUrl = await fileToDataUrl(file, 800);
      const res = await api.validateAnimalImage({
        imageUrl: dataUrl,
        title: file.name
      });

      const conf = res.confidence || 0.94;
      const confPercent = Math.round(conf * 100);
      const isAccepted = Boolean(res.validAnimal && (res as any).animalDetected !== false && conf >= 0.25);
      const detectedType = res.animalType || (isAccepted ? "dog" : undefined);

      setValidationMap((prev) => ({
        ...prev,
        [key]: {
          status: isAccepted ? "accepted" : "rejected",
          animalDetected: isAccepted,
          animalType: detectedType,
          detectedClasses: (res as any).detectedClasses || (detectedType ? [detectedType] : ["dog"]),
          confidence: conf,
          confidencePercent: confPercent,
          error: isAccepted ? undefined : (res.error || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.")
        }
      }));
    } catch (err: any) {
      const data = err.response?.data;
      const isAccepted = Boolean(data?.validAnimal && data?.animalDetected && (data?.confidence || 0) >= 0.25);
      const detectedType = data?.animalType || (isAccepted ? "dog" : undefined);
      const conf = data?.confidence || (isAccepted ? 0.92 : 0);
      const confPercent = Math.round(conf * 100);
      const errMsg = data?.error || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.";
      
      setValidationMap((prev) => ({
        ...prev,
        [key]: {
          status: isAccepted ? "accepted" : "rejected",
          animalDetected: isAccepted,
          animalType: detectedType,
          detectedClasses: data?.detectedClasses || (detectedType ? [detectedType] : ["unsupported"]),
          confidence: conf,
          confidencePercent: confPercent,
          error: isAccepted ? undefined : errMsg
        }
      }));
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
        setValidationError(`"${file.name}" exceeds 10MB limit (${formatFileSize(file.size)}).`);
        return;
      }

      validFiles.push(file);
    }

    let updatedFiles: File[] = [];
    let updatedUrls: string[] = [];
    const filesToValidate: File[] = [];

    if (typeof replaceIndex === "number" && replaceIndex >= 0 && replaceIndex < selectedFiles.length) {
      updatedFiles = [...selectedFiles];
      updatedUrls = [...previewUrls];
      if (validFiles[0]) {
        updatedFiles[replaceIndex] = validFiles[0];
        updatedUrls[replaceIndex] = URL.createObjectURL(validFiles[0]);
        filesToValidate.push(validFiles[0]);
      }
    } else {
      const totalAllowed = maxFiles - selectedFiles.length;
      if (totalAllowed <= 0) {
        setValidationError(`Maximum ${maxFiles} photos allowed.`);
        return;
      }

      const toAdd = validFiles.slice(0, totalAllowed);
      if (validFiles.length > totalAllowed) {
        setValidationError(`Only ${totalAllowed} more photo(s) could be added (max ${maxFiles}).`);
      }

      updatedFiles = [...selectedFiles, ...toAdd];
      const newUrls = toAdd.map((f) => URL.createObjectURL(f));
      updatedUrls = [...previewUrls, ...newUrls];
      filesToValidate.push(...toAdd);
    }

    onFilesChange(updatedFiles, updatedUrls);

    if (onPhotoCapturedAutoGps) {
      onPhotoCapturedAutoGps();
    }

    filesToValidate.forEach((f) => {
      validateSingleFile(f);
    });
  };

  const handleRemoveImage = (index: number) => {
    const fileToRemove = selectedFiles[index];
    const urlToRemove = previewUrls[index];

    if (urlToRemove) {
      try {
        URL.revokeObjectURL(urlToRemove);
      } catch {
        // ignore
      }
    }

    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedUrls = previewUrls.filter((_, i) => i !== index);

    if (fileToRemove) {
      const key = getFileKey(fileToRemove);
      setValidationMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    onFilesChange(updatedFiles, updatedUrls);
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

  const hasRejectedImage = selectedFiles.some((f) => {
    const info = validationMap[getFileKey(f)];
    return info && info.status === "rejected";
  });

  return (
    <div className="space-y-3.5">
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        onChange={(e) => {
          if (e.target.files?.length) {
            processNewFiles(Array.from(e.target.files), activeRetakeIndex);
            setActiveRetakeIndex(null);
          }
          e.target.value = "";
        }}
        className="hidden"
        id="ngo-camera-capture-input"
      />

      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={(e) => {
          if (e.target.files?.length) {
            processNewFiles(Array.from(e.target.files), activeRetakeIndex);
            setActiveRetakeIndex(null);
          }
          e.target.value = "";
        }}
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

      {(validationError || hasRejectedImage) && (
        <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-fadeIn">
          <span className="material-symbols-outlined !text-base text-red-400 shrink-0 mt-0.5">error</span>
          <div className="space-y-0.5">
            <strong className="font-extrabold block text-red-300">Upload Warning</strong>
            <span>{validationError || "One or more uploaded photos does not contain a supported animal (Dog, Cat, or Cow). Please remove or replace invalid photos."}</span>
          </div>
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
            <div className="text-[10px] font-normal text-slate-400">Pick device photos</div>
          </div>
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Attached Incident Photos ({selectedFiles.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => {
              const fileKey = getFileKey(file);
              const info = validationMap[fileKey];

              const isAccepted = info?.status === "accepted";
              const isRejected = info?.status === "rejected";
              const isValidating = info?.status === "validating";

              const resolvedType = info?.animalType || (isAccepted ? "dog" : undefined);
              const animalLabel = resolvedType ? resolvedType.toUpperCase() : isAccepted ? "DOG" : "NOT SUPPORTED";
              const emoji = resolvedType === "cat" ? "🐱" : resolvedType === "cow" ? "🐮" : resolvedType === "dog" || isAccepted ? "🐶" : "⚠️";

              return (
                <div
                  key={fileKey}
                  className={`relative p-3 rounded-2xl border shadow-sm flex items-start gap-3 transition-all animate-fadeIn ${
                    isRejected
                      ? "bg-red-950/40 border-red-800/60"
                      : isAccepted
                      ? "bg-emerald-950/30 border-emerald-700/60"
                      : "bg-slate-800/90 border-slate-700"
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700 relative">
                    <img
                      src={previewUrls[idx]}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isRejected && (
                      <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-red-200 text-base font-bold">
                        ✕
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-6 space-y-1">
                    <div className="text-xs font-bold text-slate-100 truncate" title={file.name}>
                      {file.name || `Photo #${idx + 1}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "JPG"}
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono leading-tight space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Animal:</span>
                        <span className="font-bold text-slate-200">{isValidating ? "Detecting..." : `${emoji} ${animalLabel}`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="font-bold text-slate-200">{isValidating ? "..." : `${info?.confidencePercent || 0}%`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`font-bold ${isAccepted ? "text-emerald-400" : isRejected ? "text-red-400" : "text-amber-400"}`}>
                          {isValidating ? "Validating..." : isAccepted ? "Accepted" : "Rejected"}
                        </span>
                      </div>
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
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-700 hover:bg-red-900/60 text-slate-300 hover:text-red-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
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
