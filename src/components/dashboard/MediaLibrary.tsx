"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, type UploadedImage } from "@/lib/api";
import { PageTitle, btnPrimary, formatDate } from "@/components/dashboard/admin-ui";
import { useConfirm } from "@/components/dashboard/confirm";

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const MediaLibrary = () => {
  const confirm = useConfirm();
  const [items, setItems] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await api.uploads.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load media");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        const saved = await api.uploads.upload(f);
        setItems((list) => [saved, ...list]);
        ok++;
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    if (ok) toast.success(`${ok} image(s) uploaded`);
    setUploading(false);
  }

  async function remove(it: UploadedImage) {
    const ok = await confirm({
      title: "Delete this image?",
      description: (
        <>
          <span className="font-medium text-slate-800">{it.name}</span> will be deleted permanently. If it's used on a product, post or page, it will stop showing there.
        </>
      ),
      confirmLabel: "Delete image",
    });
    if (!ok) return;
    try {
      await api.uploads.remove(it.name);
      setItems((list) => list.filter((x) => x.name !== it.name));
      toast.success("Image deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Image address copied");
    } catch {
      window.prompt("Copy this address", url);
    }
  }

  return (
    <>
      <PageTitle
        title="Media library"
        actions={
          <label className={`${btnPrimary} cursor-pointer`}>
            {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {uploading ? "Uploading…" : "Upload images"}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} />
          </label>
        }
      >
        <p className="text-sm text-slate-500">Images are resized to max 2000 px and saved in an efficient format automatically.</p>
      </PageTitle>
      <div className="p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void upload(e.dataTransfer.files);
          }}
          className={`mb-6 rounded-md border-2 border-dashed p-6 text-center text-sm transition ${
            dragOver ? "border-accent bg-accent/5 text-slate-700" : "border-slate-300 bg-white text-slate-500"
          }`}
        >
          Drag &amp; drop images here to upload
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">
            <Loader2 size={16} className="mr-2 inline animate-spin" aria-hidden="true" /> Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No images uploaded yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((it) => (
              <li key={it.name} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <img src={it.url} alt="" className="aspect-square w-full bg-slate-50 object-contain p-2" loading="lazy" />
                <div className="border-t border-slate-100 p-2.5 text-xs">
                  <p className="truncate font-medium text-slate-800" title={it.name}>
                    {it.name}
                  </p>
                  <p className="text-slate-500">
                    {kb(it.size)} · {formatDate(it.createdAt)}
                  </p>
                  <div className="mt-2 flex justify-between">
                    <button type="button" onClick={() => void copy(it.url)} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                      <Copy size={12} aria-hidden="true" /> Copy address
                    </button>
                    <button type="button" onClick={() => void remove(it)} className="text-slate-400 hover:text-red-600" aria-label={`Delete ${it.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default MediaLibrary;
