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

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validate and add files
  const processNewFiles = (newFiles: File[], replaceIndex?: number | null) => {
    setValidationError(null);

    const validFiles: File[] = [];

    for (const file of newFiles) {
      // 1. Format validation
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        setValidationError(`"${file.name}" is not supported. Please upload JPG, PNG, or WEBP images.`);
        return;
      }

      // 2. Size validation (10 MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(`"${file.name}" exceeds the 10MB limit (${formatFileSize(file.size)}). Please select a smaller photo.`);
        return;
      }

      validFiles.push(file);
    }

    let updatedFiles: File[] = [];
    let updatedUrls: string[] = [];

    if (typeof replaceIndex === "number" && replaceIndex >= 0) {
      // Retake / Replace single image
      updatedFiles = [...selectedFiles];
      updatedUrls = [...previewUrls];
      if (validFiles[0]) {
        updatedFiles[replaceIndex] = validFiles[0];
        updatedUrls[replaceIndex] = URL.createObjectURL(validFiles[0]);
      }
    } else {
      // Append new images up to maxFiles
      const totalAllowed = maxFiles - selectedFiles.length;
      if (totalAllowed <= 0) {
        setValidationError(`Maximum ${maxFiles} photos allowed per rescue report.`);
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

    // Auto-trigger GPS capture after photo taken
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
    // Reset input value so same camera file can be re-selected
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
    // Detect mobile touch vs desktop
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
      {/* Hidden File Inputs */}
      {/* 1. Mobile Camera Input with capture="environment" */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        capture="environment"
        onChange={handleMobileCameraCapture}
        className="hidden"
        id="paw-camera-capture-input"
      />

      {/* 2. Gallery Multiple File Input */}
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleGallerySelect}
        className="hidden"
        id="paw-gallery-upload-input"
      />

      {/* Title & Count Badge */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span>Dog Photos</span>
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
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined !text-base text-red-500 shrink-0">error</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Two Large Touch-Friendly Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Button 1: Live Camera Capture */}
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

        {/* Button 2: Upload From Gallery */}
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
            <div className="text-[10px] font-normal text-slate-500">Pick from device photos</div>
          </div>
        </button>
      </div>

      {/* Captured Image Preview Cards */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Attached Incident Photos
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 animate-fadeIn"
              >
                {/* Image Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={previewUrls[idx]}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {file.name || `Photo #${idx + 1}`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {formatFileSize(file.size)} • {file.type.split("/")[1]?.toUpperCase() || "JPG"}
                  </div>

                  {/* Retake Action */}
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
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center text-xs font-bold transition-colors"
                  title="Remove Photo"
                >
                  ✕
                </button>
              </div>
            ))}
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
