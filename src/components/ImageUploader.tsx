import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../api/upload';
import { toast } from './ui/Toast';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxCount?: number;
  maxSizeMB?: number;
}

interface UploadingItem {
  id: string;
  progress: number;
  error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ImageUploader({
  images,
  onImagesChange,
  maxCount = 10,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 JPG/PNG/GIF/WebP 格式';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `图片大小不能超过 ${maxSizeMB}MB`;
    }
    if (images.length + uploading.length >= maxCount) {
      return `单帖最多上传 ${maxCount} 张图片`;
    }
    return null;
  };

  const uploadSingle = useCallback(
    async (file: File) => {
      const id = crypto.randomUUID();
      const uploadItem: UploadingItem = { id, progress: 0 };
      setUploading((prev) => [...prev, uploadItem]);

      try {
        // Simulate progress since axios doesn't give us streaming progress easily
        const progressInterval = setInterval(() => {
          setUploading((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: Math.min(u.progress + 30, 90) } : u)),
          );
        }, 200);

        const result = await uploadFile(file);
        clearInterval(progressInterval);

        setUploading((prev) => prev.filter((u) => u.id !== id));
        onImagesChange([...images, result.url]);
      } catch (err: any) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, progress: 0, error: err?.message || '上传失败' } : u,
          ),
        );
        toast.error('图片上传失败，请检查网络后重试');
      }
    },
    [images, onImagesChange, uploading],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          continue;
        }
        uploadSingle(file);
      }
    },
    [validateFile, uploadSingle],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith('image/'));
      if (imageItems.length > 0) {
        e.preventDefault();
        const files: File[] = [];
        imageItems.forEach((item) => {
          const file = item.getAsFile();
          if (file) files.push(file);
        });
        if (files.length > 0) {
          const dt = new DataTransfer();
          files.forEach((f) => dt.items.add(f));
          handleFiles(dt.files);
        }
      }
    },
    [handleFiles],
  );

  const handleRemove = (url: string) => {
    onImagesChange(images.filter((u) => u !== url));
  };

  const handleRetry = (item: UploadingItem) => {
    setUploading((prev) => prev.filter((u) => u.id !== item.id));
  };

  return (
    <div className="image-uploader">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-150 ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-gray-500 hover:text-primary-500 transition-colors duration-150"
        >
          <div className="mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto text-gray-400">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          拖拽、粘贴或点击上传图片
        </button>
        <p className="mt-1 text-xs text-gray-400">
          支持 JPG/PNG/GIF/WebP，单张 ≤{maxSizeMB}MB，最多 {maxCount} 张
        </p>
      </div>

      {/* Uploading progress */}
      {uploading.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploading.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-md ${
                item.error ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              {item.error ? (
                <>
                  <span className="text-xs text-red-500 flex-1">{item.error}</span>
                  <button
                    type="button"
                    onClick={() => handleRetry(item)}
                    className="text-xs text-primary-500 hover:text-primary-600"
                  >
                    移除
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{item.progress}%</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-md overflow-hidden border border-gray-200">
              <img
                src={url}
                alt={`已上传图片 ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-0 right-0 w-5 h-5 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label={`移除图片 ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
