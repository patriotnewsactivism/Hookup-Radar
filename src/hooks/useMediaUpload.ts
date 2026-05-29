import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UploadResult {
  mediaId: string;
  url: string;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateUploadUrl = useMutation(api.surgeMedia.generateUploadUrl);
  const saveMedia = useMutation(api.surgeMedia.saveMedia);

  const upload = async (
    file: File,
    userId: string,
    options: {
      isProfilePhoto?: boolean;
      albumId?: string;
      sortOrder?: number;
    } = {}
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);

    try {
      // Validate file
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        throw new Error("Only image and video files are allowed");
      }

      // Size limits: 10MB for images, 100MB for videos
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `File too large. Max ${isVideo ? "100MB" : "10MB"} for ${isVideo ? "videos" : "images"}`
        );
      }

      setProgress(10);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      setProgress(20);

      // Upload the file directly to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      setProgress(80);

      // Save metadata
      const saved = await saveMedia({
        user_id: userId,
        storage_id: storageId,
        type: isImage ? "image" : "video",
        filename: file.name,
        size: file.size,
        is_profile_photo: options.isProfilePhoto ?? false,
        album_id: options.albumId as any,
        sort_order: options.sortOrder,
      });

      setProgress(100);
      return { mediaId: saved.mediaId as string, url: saved.url };
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    files: File[],
    userId: string,
    options: {
      albumId?: string;
      isProfilePhoto?: boolean;
    } = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const r = await upload(files[i], userId, {
        ...options,
        sortOrder: i,
      });
      if (r) results.push(r);
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    return results;
  };

  return { upload, uploadMultiple, uploading, progress };
}
