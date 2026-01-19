import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

interface QRScannerProps {
  onDetect: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onDetect }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let videoElement: HTMLVideoElement | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoElement = videoRef.current;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Unable to access camera. Please check permissions.");
        setIsActive(false);
      }
    };

    startCamera();

    return () => {
      if (videoElement?.srcObject) {
        const tracks = (videoElement.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    let scanning = true;

    const scanFrame = () => {
      if (!scanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Simple QR code detection using jsQR
        type JsQRFunction = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
        const jsQR = (window as { jsQR?: JsQRFunction }).jsQR;
        if (jsQR) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            scanning = false;
            setIsActive(false);
            onDetect(code.data);
            return;
          }
        }
      }

      if (scanning) {
        requestAnimationFrame(scanFrame);
      }
    };

    scanFrame();

    return () => {
      scanning = false;
    };
  }, [isActive, onDetect]);

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsActive(!isActive)}
        variant={isActive ? "destructive" : "default"}
        className="w-full"
        size="lg"
      >
        {isActive ? (
          <>
            <VideoOff className="mr-2 h-4 w-4" />
            Stop Scanning
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Start Camera
          </>
        )}
      </Button>
      {isActive && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-primary rounded-lg shadow-[inset_0_0_30px_rgba(var(--primary),0.3)]" />
          </div>
        </div>
      )}
    </div>
  );
};
