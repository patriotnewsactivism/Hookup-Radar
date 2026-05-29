import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Lock, Unlock, Image, Film, X, ChevronLeft } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import { toast } from "sonner";

interface Props {
  userId: string;
}

export function AlbumManager({ userId }: Props) {
  const albums = useQuery(api.surgeMedia.getAlbums, { user_id: userId });
  const createAlbum = useMutation(api.surgeMedia.createAlbum);
  const deleteAlbum = useMutation(api.surgeMedia.deleteAlbum);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const selectedAlbum = albums?.find((a) => a._id === selectedAlbumId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createAlbum({
        user_id: userId,
        name: newName.trim(),
        is_private: newPrivate,
      });
      setNewName("");
      setNewPrivate(false);
      setShowCreate(false);
      toast.success("Album created!");
    } catch {
      toast.error("Failed to create album");
    }
  };

  const handleDelete = async (albumId: string) => {
    if (!confirm("Delete this album and all its photos/videos?")) return;
    try {
      await deleteAlbum({ album_id: albumId as any });
      setSelectedAlbumId(null);
      toast.success("Album deleted");
    } catch {
      toast.error("Failed to delete album");
    }
  };

  // Album detail view
  if (selectedAlbum) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedAlbumId(null)}
            className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{selectedAlbum.name}</h3>
            <p className="text-xs text-gray-500">
              {selectedAlbum.photo_count} photos · {selectedAlbum.video_count} videos
              {selectedAlbum.is_private && " · 🔒 Private"}
            </p>
          </div>
          <button
            onClick={() => handleDelete(selectedAlbum._id)}
            className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center hover:bg-red-900/50 text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <AlbumMediaGrid albumId={selectedAlbum._id} userId={userId} />
      </div>
    );
  }

  // Album list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Albums</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
        >
          <Plus size={14} />
          New Album
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Album name"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setNewPrivate(!newPrivate)}
              className="flex items-center gap-2 text-xs text-gray-400"
            >
              {newPrivate ? <Lock size={12} /> : <Unlock size={12} />}
              {newPrivate ? "Private" : "Public"}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Album cards */}
      {!albums ? (
        <div className="text-center text-gray-600 text-sm py-8">Loading...</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-3">
            <Image size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No albums yet</p>
          <p className="text-gray-700 text-xs mt-1">
            Create albums with up to 15 photos and multiple videos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {albums.map((album) => (
            <button
              key={album._id}
              onClick={() => setSelectedAlbumId(album._id)}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden text-left hover:bg-white/10 transition-all group"
            >
              {/* Cover */}
              <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40 relative overflow-hidden">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={20} className="text-gray-600" />
                  </div>
                )}
                {album.is_private && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                    <Lock size={10} className="text-white" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-white text-sm font-medium truncate">
                  {album.name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {album.photo_count} <Image size={10} className="inline" />
                  {album.video_count > 0 && (
                    <> · {album.video_count} <Film size={10} className="inline" /></>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for album media grid with upload
function AlbumMediaGrid({ albumId, userId }: { albumId: string; userId: string }) {
  const media = useQuery(api.surgeMedia.getByAlbum, { album_id: albumId as any });
  const deleteMedia = useMutation(api.surgeMedia.deleteMedia);
  const [viewMedia, setViewMedia] = useState<{ url: string; type: string } | null>(null);

  const photoCount = media?.filter((m) => m.type === "image").length ?? 0;
  const canAddMore = photoCount < 15;

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {canAddMore && (
        <PhotoUpload
          userId={userId}
          maxPhotos={15}
          albumId={albumId}
          existingUrls={media?.filter((m) => m.type === "image").map((m) => m.url) ?? []}
          allowVideo={true}
        />
      )}

      {!canAddMore && (
        <p className="text-xs text-amber-400 text-center">
          Maximum 15 photos reached for this album
        </p>
      )}

      {/* Media grid (includes videos) */}
      {media && media.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {media.map((m) => (
            <div
              key={m._id}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => setViewMedia({ url: m.url, type: m.type })}
            >
              {m.type === "video" ? (
                <div className="w-full h-full bg-black/50 flex items-center justify-center">
                  <Film size={20} className="text-purple-400" />
                </div>
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMedia({ media_id: m._id }).then(() =>
                    toast.success("Deleted")
                  );
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full items-center justify-center hidden group-hover:flex"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      {viewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setViewMedia(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
            onClick={() => setViewMedia(null)}
          >
            <X size={20} className="text-white" />
          </button>
          {viewMedia.type === "video" ? (
            <video
              src={viewMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={viewMedia.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
