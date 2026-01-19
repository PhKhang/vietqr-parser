import { useState, useRef, useEffect } from "react";
import { QRScanner } from "./QRScanner";
import { VietQRDisplay } from "./VietQRDisplay";
import { VietQRParser } from "./vietqrParser";
import type { VietQRData } from "./vietqrParser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Scan, Copy, Check } from "lucide-react";

function App() {
  const [qrData, setQrData] = useState<VietQRData | null>(null);
  const [rawQrString, setRawQrString] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parser = new VietQRParser();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const processImageFromSource = async (imgSrc: string) => {
    try {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Use jsQR to decode
        type JsQRFunction = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
        const jsQR = (window as { jsQR?: JsQRFunction }).jsQR;
        if (!jsQR) {
          setError("QR decoding library not loaded");
          setLoading(false);
          return;
        }

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setRawQrString(code.data);
          const result = parser.invoke(code.data);
          if (result.success && result.data) {
            setQrData(result.data);
          } else {
            setError(result.error || "Failed to parse QR code");
          }
        } else {
          setError("No QR code detected in image");
        }
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to load image");
        setLoading(false);
      };
      img.src = imgSrc;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process image"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          event.preventDefault();
          const blob = items[i].getAsFile();
          if (!blob) continue;

          setLoading(true);
          setError(null);

          const reader = new FileReader();
          reader.onload = (e) => {
            processImageFromSource(e.target?.result as string);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const handleQRDetected = (data: string) => {
    setLoading(true);
    setError(null);
    setRawQrString(data);
    setTimeout(() => {
      const result = parser.invoke(data);
      if (result.success && result.data) {
        setQrData(result.data);
      } else {
        setError(result.error || "Failed to parse QR code");
      }
      setLoading(false);
    }, 100);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      processImageFromSource(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Scan className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">VietQR Scanner</h1>
              <p className="text-sm text-muted-foreground">
                Scan, upload, or paste (Ctrl+V / Cmd+V) QR codes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Scan
              </CardTitle>
              <CardDescription>Use your device camera to scan QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner onDetect={handleQRDetected} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>Choose or paste an image containing a QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-center text-sm text-muted-foreground border rounded-md p-3 bg-muted/50">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Ctrl+V</kbd>
                {" / "}
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Cmd+V</kbd>
                {" "}to paste
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Processing QR code...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-destructive/10 p-2">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                {rawQrString && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium">Raw QR String:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(rawQrString)}
                      >
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono max-w-full break-all whitespace-pre-wrap">{rawQrString}</pre>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  setQrData(null);
                  setRawQrString(null);
                }}
              >
                ✕
              </Button>
            </CardContent>
          </Card>
        )}

        {qrData && (
          <div className="space-y-4">
            {rawQrString && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">Raw QR String:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(rawQrString)}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => {
                          setQrData(null);
                          setError(null);
                          setRawQrString(null);
                        }}
                      >
                        Scan Another
                      </Button>
                    </div>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto font-mono max-w-full break-all whitespace-pre-wrap">{rawQrString}</pre>
                </CardContent>
              </Card>
            )}
            <VietQRDisplay data={qrData} />
          </div>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          VietQR Scanner | All processing done locally in your browser
        </div>
      </footer>
    </div>
  );
}

export default App;
