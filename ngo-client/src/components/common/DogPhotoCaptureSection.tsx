import React, { useState, useRef } from "react";
import { LiveWebcamModal } from "./LiveWebcamModal";

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processNewFiles = (newFiles: File[], replaceIndex?: number | null) => {
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

      validFiles.push(file);
    }

    let updatedFiles: File[] = [];
    let updatedUrls: string[] = [];

    if (typeof replaceIndex === "number" && replaceIndex >= 0) {
      updatedFiles = [...selectedFiles];
      updatedUrls = [...previewUrls];
      if (validFiles[0]) {
        updatedFiles[replaceIndex] = validFiles[0];
        updatedUrls[replaceIndex] = URL.createObjectURL(validFiles[0]);
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

      updatedFiles = [...selectedFiles, ...filesToAdd];
      const newUrls = filesToAdd.map((file) => URL.createObjectURL(file));
      updatedUrls = [...previewUrls, ...newUrls];
    }

    onFilesChange(updatedFiles, updatedUrls);

    if (onPhotoCapturedAutoGps) {
      onPhotoCapturedAutoGps();
    }
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
          <span>Dog Photos</span>
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
            <div className="text-[10px] font-normal text-slate-400">Pick from device files</div>
          </div>
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Attached Dog Photos
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-3 animate-fadeIn"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                  <img
                    src={previewUrls[idx]}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {file.name || `Photo #${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "JPG"}
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
            ))}
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
