import { useState, useRef } from "react";
import { Camera, X, Plus, Loader2, Image, Film } from "lucide-react";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { toast } from "sonner";

interface Props {
  userId: string;
  maxPhotos?: number;
  albumId?: string;
  existingUrls?: string[];
  onUploadComplete?: (urls: string[]) => void;
  isProfilePhoto?: boolean;
  allowVideo?: boolean;
  compact?: boolean;
}

export function PhotoUpload({
  userId,
  maxPhotos = 15,
  albumId,
  existingUrls = [],
  onUploadComplete,
  isProfilePhoto = false,
  allowVideo = true,
  compact = false,
}: Props) {
  const { upload, uploadMultiple, uploading, progress } = useMediaUpload();
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = maxPhotos - urls.length;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > remaining) {
      toast.error(`You can only add ${remaining} more file${remaining !== 1 ? "s" : ""}`);
      return;
    }

    try {
      if (isProfilePhoto && files.length === 1) {
        const result = await upload(files[0], userId, { isProfilePhoto: true });
        if (result) {
          setUrls([result.url]);
          onUploadComplete?.([result.url]);
          toast.success("Profile photo updated!");
        }
      } else {
        const results = await uploadMultiple(files, userId, { albumId });
        const newUrls = results.map((r) => r.url);
        const updated = [...urls, ...newUrls];
        setUrls(updated);
        onUploadComplete?.(updated);
        toast.success(`${results.length} file${results.length !== 1 ? "s" : ""} uploaded!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const acceptTypes = allowVideo ? "image/*,video/*" : "image/*";

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple={!isProfilePhoto}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{progress}%</span>
            </>
          ) : (
            <>
              <Camera size={16} />
              <span>{isProfilePhoto ? "Change Photo" : "Add Photos"}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={!isProfilePhoto && maxPhotos > 1}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      {uploading && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-purple-300 mb-2">
            <Loader2 size={14} className="animate-spin" />
            Uploading... {progress}%
          </div>
          <div className="h-1.5 bg-purple-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
          >
            {url.includes("video") ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Film size={24} className="text-gray-500" />
              </div>
            ) : (
              <img src={url} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => {
                const updated = urls.filter((_, j) => j !== i);
                setUrls(updated);
                onUploadComplete?.(updated);
              }}
              className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} className="text-white" />
            </button>
            {i === 0 && !albumId && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-600/80 rounded text-[10px] text-white font-medium">
                Main
              </div>
            )}
          </div>
        ))}

        {/* Add button */}
        {remaining > 0 && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all"
          >
            <Plus size={20} />
            <span className="text-[10px]">
              {allowVideo ? "Photo/Video" : "Photo"}
            </span>
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-600 text-center">
        {urls.length}/{maxPhotos} {allowVideo ? "files" : "photos"}
        {allowVideo && (
          <span className="text-gray-700"> · Photos up to 10MB, videos up to 100MB</span>
        )}
      </p>
    </div>
  );
}
