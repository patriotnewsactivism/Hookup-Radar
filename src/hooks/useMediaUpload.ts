import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UploadResult {
  mediaId: string;
  storageId: string;
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
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) throw new Error("Only image and video files are allowed");

      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large. Max ${isVideo ? "100MB" : "10MB"}`);
      }

      setProgress(10);
      const uploadUrl = await generateUploadUrl();
      setProgress(20);

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");

      const uploadResponse = await result.json();
      if (!uploadResponse?.storageId) throw new Error("Upload did not return a storage ID");
      setProgress(80);

      const saved = await saveMedia({
        user_id: userId,
        storage_id: uploadResponse.storageId,
        type: isImage ? "image" : "video",
        filename: file.name,
        size: file.size,
        is_profile_photo: options.isProfilePhoto ?? false,
        album_id: options.albumId as any,
        sort_order: options.sortOrder,
      });

      setProgress(100);
      return {
        mediaId: saved.mediaId as string,
        storageId: saved.storageId as string,
        url: saved.url,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    files: File[],
    userId: string,
    options: { albumId?: string; isProfilePhoto?: boolean } = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const result = await upload(files[index], userId, {
        ...options,
        sortOrder: index,
      });
      if (result) results.push(result);
      setProgress(Math.round(((index + 1) / files.length) * 100));
    }
    return results;
  };

  return { upload, uploadMultiple, uploading, progress };
}
