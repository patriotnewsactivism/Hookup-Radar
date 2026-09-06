import { useState } from 'react';
import { media } from '../lib/surgeApi';

interface UploadResult {
  mediaId: string;
  storageId?: string;
  url: string;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) throw new Error('Only image and video files are allowed');

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large. Max ${isVideo ? '50MB' : '10MB'}`);
      }

      setProgress(20);
      const { path, url } = await media.uploadFile(file, userId);
      setProgress(70);

      const saved = await media.saveMedia({
        storage_id: path,
        url,
        type: isImage ? 'image' : 'video',
        filename: file.name,
        size: file.size,
        is_profile_photo: options.isProfilePhoto ?? false,
        album_id: options.albumId,
        sort_order: options.sortOrder,
      });

      setProgress(100);
      return {
        mediaId: saved.mediaId as string,
        storageId: path,
        url: saved.url,
      };
    } catch (error) {
      console.error('Upload error:', error);
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
