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

      const conf = typeof res.confidence === "number" ? res.confidence : 0;
      const confPercent = Math.round(conf * 100);
      const isAccepted = Boolean(res.validAnimal && (res as any).animalDetected !== false && res.status !== "rejected" && conf >= 0.25);
      const detectedType = isAccepted ? res.animalType : undefined;

      setValidationMap((prev) => ({
        ...prev,
        [key]: {
          status: isAccepted ? "accepted" : "rejected",
          animalDetected: isAccepted,
          animalType: detectedType,
          detectedClasses: (res as any).detectedClasses || [],
          confidence: conf,
          confidencePercent: confPercent,
          error: isAccepted ? undefined : (res.error || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.")
        }
      }));
    } catch (err: any) {
      const data = err.response?.data;
      const conf = typeof data?.confidence === "number" ? data.confidence : 0;
      const confPercent = Math.round(conf * 100);
      const isAccepted = Boolean(data?.validAnimal && data?.animalDetected && data?.status !== "rejected" && conf >= 0.25);
      const detectedType = isAccepted ? data?.animalType : undefined;
      const errMsg = data?.error || err.message || "Please upload a clear image of a Dog, Cat, or Cow. The uploaded image does not contain a supported animal.";
      
      setValidationMap((prev) => ({
        ...prev,
        [key]: {
          status: isAccepted ? "accepted" : "rejected",
          animalDetected: isAccepted,
          animalType: detectedType,
          detectedClasses: data?.detectedClasses || [],
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
      {/* Hidden File Inputs */}
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
        id="paw-camera-capture-input"
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
        id="paw-gallery-upload-input"
      />

      {/* Title & Count Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>Animal Photos (Dog, Cat, Cow)</span>
          <span className="text-[11px] font-normal text-slate-500">
            ({selectedFiles.length}/{maxFiles} attached)
          </span>
        </label>

        {locationCaptured && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold animate-fadeIn">
            <span className="material-symbols-outlined !text-xs text-emerald-600">my_location</span>
            <span>📍 Current Location Captured</span>
          </div>
        )}
      </div>

      {/* Validation Warning Alert */}
      {(validationError || hasRejectedImage) && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5 animate-fadeIn shadow-xs">
          <span className="material-symbols-outlined !text-lg text-red-600 shrink-0 mt-0.5">error</span>
          <div className="space-y-0.5">
            <strong className="font-extrabold block text-red-950">Upload Warning</strong>
            <span>{validationError || "One or more uploaded images does not contain a supported animal (Dog, Cat, or Cow). Please remove or replace invalid photos."}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleLiveCameraClick}
          disabled={selectedFiles.length >= maxFiles}
          className="h-14 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white rounded-2xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined !text-xl text-white">photo_camera</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold leading-tight">📷 Capture Live Photo</div>
            <div className="text-[10px] font-normal text-orange-100">Rear Camera / Webcam</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={selectedFiles.length >= maxFiles}
          className="h-14 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 active:scale-[0.98] text-slate-800 rounded-2xl font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined !text-xl">photo_library</span>
          </div>
          <div className="text-left">
            <div className="text-xs font-extrabold text-slate-900 leading-tight">🖼 Upload From Gallery</div>
            <div className="text-[10px] font-normal text-slate-500">Pick device photos</div>
          </div>
        </button>
      </div>

      {/* Preview Cards with Independent Debug & Status Info */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Attached Incident Photos ({selectedFiles.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => {
              const fileKey = getFileKey(file);
              const info = validationMap[fileKey];

              const isAccepted = info?.status === "accepted";
              const isRejected = info?.status === "rejected";
              const isValidating = info?.status === "validating";

              const resolvedType = info?.animalType;
              const animalLabel = resolvedType ? resolvedType.toUpperCase() : "UNKNOWN";
              const emoji = resolvedType === "cat" ? "🐱" : resolvedType === "cow" ? "🐮" : resolvedType === "dog" ? "🐶" : "⚠️";

              return (
                <div
                  key={fileKey}
                  className={`relative p-3 rounded-2xl border shadow-sm flex items-start gap-3 transition-all animate-fadeIn ${
                    isRejected
                      ? "bg-red-50/90 border-red-300"
                      : isAccepted
                      ? "bg-emerald-50/60 border-emerald-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                    <img
                      src={previewUrls[idx]}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isRejected && (
                      <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center text-red-200 text-base font-bold">
                        ✕
                      </div>
                    )}
                  </div>

                  {/* Debug / Status Info */}
                  <div className="flex-1 min-w-0 pr-6 space-y-1">
                    <div className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                      {file.name || `Photo #${idx + 1}`}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "JPG"}
                    </div>

                    {/* Debug Mode Info Display */}
                    <div className="p-1.5 rounded-lg bg-slate-100/80 border border-slate-200/80 text-[10px] font-mono leading-tight space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Animal:</span>
                        <span className="font-bold text-slate-900">{isValidating ? "Detecting..." : `${emoji} ${animalLabel}`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Confidence:</span>
                        <span className="font-bold text-slate-900">{isValidating ? "..." : `${info?.confidencePercent || 0}%`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className={`font-bold ${isAccepted ? "text-emerald-700" : isRejected ? "text-red-700" : "text-amber-600"}`}>
                          {isValidating ? "Validating..." : isAccepted ? "Accepted" : "Rejected"}
                        </span>
                      </div>
                    </div>

                    {/* Retake button */}
                    <button
                      type="button"
                      onClick={() => handleRetakeImage(idx)}
                      className="mt-1 text-[11px] text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined !text-xs">refresh</span>
                      <span>Retake</span>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
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

      {/* Desktop Webcam Live Modal */}
      <LiveWebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onPhotoCaptured={handleWebcamPhotoCaptured}
      />
    </div>
  );
};
