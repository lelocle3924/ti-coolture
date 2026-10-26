import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, Image as ImageIcon, RefreshCw, X, ZoomIn } from "lucide-react";

interface ImageCropDialogProps {
  file: File;
  title: string;
  aspectRatio: number;
  shape: "circle" | "rectangle";
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

interface CropPosition {
  x: number;
  y: number;
}

const OUTPUT_WIDTH = 1600;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createCroppedImage(
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number,
  zoom: number,
  position: CropPosition,
  aspectRatio: number,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = Math.round(OUTPUT_WIDTH / aspectRatio);

  const context = canvas.getContext("2d");
  if (!context) {
    return Promise.reject(new Error("Trình duyệt không thể xử lý ảnh này."));
  }

  const baseScale = Math.max(
    frameWidth / image.naturalWidth,
    frameHeight / image.naturalHeight
  );
  const renderedWidth = image.naturalWidth * baseScale * zoom;
  const renderedHeight = image.naturalHeight * baseScale * zoom;
  const left = (frameWidth - renderedWidth) * position.x;
  const top = (frameHeight - renderedHeight) * position.y;
  const outputScale = canvas.width / frameWidth;

  context.drawImage(
    image,
    left * outputScale,
    top * outputScale,
    renderedWidth * outputScale,
    renderedHeight * outputScale
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể tạo ảnh đã cắt. Vui lòng thử ảnh khác."));
          return;
        }
        const extension = blob.type === "image/webp" ? "webp" : "png";
        resolve(
          new File([blob], `${fileName.replace(/\.[^.]+$/, "")}-cropped.${extension}`, {
            type: blob.type,
          })
        );
      },
      "image/webp",
      0.92
    );
  });
}

export default function ImageCropDialog({
  file,
  title,
  aspectRatio,
  shape,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<CropPosition>({ x: 0.5, y: 0.5 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageSize({ width: 0, height: 0 });
    setFrameSize({ width: 0, height: 0 });
    setZoom(1);
    setPosition({ x: 0.5, y: 0.5 });
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const frame = cropFrameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [imageUrl, shape]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isProcessing) onCancelRef.current();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isProcessing]);

  const frameWidth = frameSize.width;
  const frameHeight = frameSize.height;
  const baseScale =
    imageSize.width && frameWidth
      ? Math.max(
          frameWidth / imageSize.width,
          frameHeight / imageSize.height
        )
      : 0;
  const renderedWidth = imageSize.width * baseScale * zoom;
  const renderedHeight = imageSize.height * baseScale * zoom;
  const imageLeft = (frameWidth - renderedWidth) * position.x;
  const imageTop = (frameHeight - renderedHeight) * position.y;

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageSize.width || isProcessing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };

    setPosition((current) => ({
      x: clamp(
        current.x - deltaX / Math.max(1, renderedWidth - frameWidth),
        0,
        1
      ),
      y: clamp(
        current.y - deltaY / Math.max(1, renderedHeight - frameHeight),
        0,
        1
      ),
    }));
  }

  function handleCropKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.05 : 0.015;
    const changes: Record<string, CropPosition> = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    const change = changes[event.key];
    if (!change) return;

    event.preventDefault();
    setPosition((current) => ({
      x: clamp(current.x + change.x, 0, 1),
      y: clamp(current.y + change.y, 0, 1),
    }));
  }

  async function handleConfirm() {
    const image = imageRef.current;
    if (!image || !frameWidth || !frameHeight || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    try {
      const croppedFile = await createCroppedImage(
        image,
        frameWidth,
        frameHeight,
        zoom,
        position,
        aspectRatio,
        file.name
      );
      await onConfirm(croppedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xử lý ảnh.");
    } finally {
      setIsProcessing(false);
    }
  }

  const stageClass =
    shape === "circle"
      ? "aspect-square w-full max-w-[360px]"
      : "aspect-[16/9] w-full max-w-[640px]";
  const frameClass =
    shape === "circle"
      ? "left-[11%] top-[11%] h-[78%] w-[78%] rounded-full"
      : "left-0 top-1/2 w-full -translate-y-1/2";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#12081f]/90 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isProcessing) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-[#3b2a60] bg-[#181224] p-5 text-[#faf8ff] shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#39d6cf]">
              <ImageIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                Chỉnh khung ảnh
              </span>
            </div>
            <h2 id="image-crop-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1 text-xs text-[#a39ab8]">
              Kéo ảnh để căn chỉnh; vùng sáng bên trong khung chính là phần sẽ được lưu.
            </p>
          </div>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Đóng chỉnh sửa ảnh"
            className="rounded-lg p-2 text-[#a39ab8] transition hover:bg-[#23173d] hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center rounded-xl bg-[#12081f] p-3 sm:p-5">
          <div className={`${stageClass} relative overflow-hidden bg-[#23173d]`}>
            {!imageSize.width && (
              <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 text-xs text-[#a39ab8]">
                <RefreshCw className="h-4 w-4 animate-spin text-[#39d6cf]" />
                Đang tải ảnh...
              </div>
            )}
            {imageUrl && (
              <div
                ref={cropFrameRef}
                role="group"
                aria-label="Khung cắt ảnh. Dùng phím mũi tên để di chuyển ảnh."
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {
                  dragRef.current = null;
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
                onKeyDown={handleCropKeyboard}
                className={`absolute z-10 cursor-grab touch-none overflow-hidden border-2 border-white shadow-[0_0_0_9999px_rgba(18,8,31,0.68)] outline-none focus-visible:ring-2 focus-visible:ring-[#39d6cf] active:cursor-grabbing ${frameClass} ${
                  shape === "circle" ? "rounded-full" : ""
                }`}
                style={{ aspectRatio }}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  onLoad={(event) => {
                    setImageSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    });
                  }}
                  onError={() => setError("Không thể đọc tệp ảnh này.")}
                  className="pointer-events-none absolute max-w-none select-none"
                  style={{
                    width: renderedWidth,
                    height: renderedHeight,
                    left: imageLeft,
                    top: imageTop,
                    visibility: imageSize.width ? "visible" : "hidden",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-lg items-center gap-3">
          <ZoomIn className="h-4 w-4 flex-shrink-0 text-[#39d6cf]" />
          <label htmlFor="image-crop-zoom" className="sr-only">
            Phóng to ảnh
          </label>
          <input
            id="image-crop-zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={!imageSize.width || isProcessing}
            className="h-2 w-full cursor-pointer accent-[#39d6cf] disabled:opacity-50"
          />
          <span className="w-12 text-right font-mono text-xs text-[#a39ab8]">
            {zoom.toFixed(1)}×
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#7b7194]">
          Tỷ lệ đầu ra {aspectRatio === 1 ? "1:1" : "2.74:1"} · Có thể căn ảnh bằng phím mũi tên
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-xl border border-[#3b2a60] px-4 py-2.5 text-xs text-[#d0c8df] transition hover:bg-[#23173d] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imageSize.width || isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7520f7] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5a12c6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {isProcessing ? "Đang lưu ảnh..." : "Dùng ảnh này"}
          </button>
        </div>
      </section>
    </div>
  );
}
