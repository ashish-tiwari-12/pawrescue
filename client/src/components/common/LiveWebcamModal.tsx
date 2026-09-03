import React, { useState, useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
}

export const LiveWebcamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPhotoCaptured
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCameraError(null);
      startCamera(facingMode);
      checkForMultipleCameras();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const checkForMultipleCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch {
      // Ignore enumeration errors
    }
  };

  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported in this browser. Please use Gallery Upload.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser settings or upload from gallery.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device was detected on your system.");
      } else {
        setCameraError(err.message || "Failed to initialize live camera.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    // Flash visual effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror image for natural selfie orientation
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    if (!stream) {
      startCamera(facingMode);
    }
  };

  const handleConfirm = () => {
    if (!capturedDataUrl) return;

    setIsCapturing(true);
    try {
      // Convert Data URL to File object
      const byteString = atob(capturedDataUrl.split(",")[1]);
      const mimeString = capturedDataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });
      const filename = `paw_live_capture_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: "image/jpeg" });

      stopCamera();
      onPhotoCaptured(file);
      onClose();
    } catch (err) {
      console.error("Failed to convert captured photo to file:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between text-white bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <span className="material-symbols-outlined !text-xl">photo_camera</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Live Dog Photo Capture</h3>
              <p className="text-[11px] text-slate-400">Position the dog clearly in frame</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Viewport / Video Preview */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-20 pointer-events-none transition-opacity duration-200 opacity-90" />
          )}

          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined !text-2xl">videocam_off</span>
              </div>
              <p className="text-xs text-red-200">{cameraError}</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined !text-base">refresh</span>
                <span>Retry Camera</span>
              </button>
            </div>
          ) : capturedDataUrl ? (
            /* Captured Snapshot Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedDataUrl}
                alt="Captured Snapshot"
                className="max-h-[380px] w-auto object-contain rounded-xl"
              />
              <div className="absolute top-3 left-3 bg-emerald-500/90 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined !text-sm">check_circle</span>
                <span>Snapshot Captured</span>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full max-h-[380px] object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Grid Targeting Overlay */}
              <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 border border-dashed border-orange-400/60 rounded-xl" />
              </div>

              {/* Camera Switch button if available */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md shadow-lg transition-transform active:scale-95"
                  title="Flip Camera (Front/Rear)"
                >
                  <span className="material-symbols-outlined !text-xl">flip_camera_android</span>
                </button>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedDataUrl ? (
            /* Confirmation & Retake */
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined !text-base">refresh</span>
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCapturing}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined !text-base">check</span>
                <span>Confirm & Attach Photo</span>
              </button>
            </div>
          ) : (
            /* Capture Action */
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
              >
                Cancel
              </button>

              {/* Center Shutter Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={Boolean(cameraError)}
                className="relative group p-1 rounded-full border-4 border-orange-500/30 hover:border-orange-500 transition-all active:scale-95 disabled:opacity-40"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined !text-2xl">photo_camera</span>
                </div>
              </button>

              <div className="text-[11px] text-slate-500 font-mono">
                {facingMode === "environment" ? "Rear Lens" : "Front Lens"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
