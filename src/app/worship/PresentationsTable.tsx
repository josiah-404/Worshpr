"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Monitor } from "lucide-react";
import { BACKGROUNDS, BG_BADGE_COLORS } from "@/lib/worship-constants";

interface Presentation {
  id:           string;
  title:        string;
  lyrics:       string;
  bgId:         string;
  transitionId: string;
  fontId:       string;
  sizeId:       string;
  createdAt:    string;
  updatedAt:    string;
}

const BG_LABELS = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b.label]));

const FONT_LABELS: Record<string, string> = {
  inter:      "Inter",
  playfair:   "Playfair",
  montserrat: "Montserrat",
  cormorant:  "Cormorant",
};

function slideCount(lyrics: string) {
  return lyrics.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).length;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PresentationsTable({
  presentations: initial,
}: {
  presentations: Presentation[];
}) {
  const router = useRouter();
  const [presentations, setPresentations] = useState(initial);
  const [deleting, setDeleting]           = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this presentation?")) return;
    setDeleting(id);
    await fetch(`/api/presentations/${id}`, { method: "DELETE" });
    setPresentations((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  if (presentations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg">
        <Monitor className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No presentations yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create your first presentation to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Background</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Font</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Slides</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {presentations.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{p.title}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BG_BADGE_COLORS[p.bgId] ?? "bg-muted text-muted-foreground"}`}>
                  {BG_LABELS[p.bgId] ?? p.bgId}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {FONT_LABELS[p.fontId] ?? p.fontId}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {slideCount(p.lyrics)}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {timeAgo(p.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => router.push(`/worship/editor?id=${p.id}`)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
