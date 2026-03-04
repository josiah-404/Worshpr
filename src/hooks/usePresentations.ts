import { useState } from "react";

export interface Presentation {
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

export function usePresentations(initialPresentations: Presentation[]) {
  const [presentations, setPresentations] = useState<Presentation[]>(initialPresentations);
  const [deleting, setDeleting]           = useState<string | null>(null);

  async function deletePresentation(id: string) {
    if (!confirm("Delete this presentation?")) return;
    setDeleting(id);
    await fetch(`/api/presentations/${id}`, { method: "DELETE" });
    setPresentations((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  return { presentations, deleting, deletePresentation };
}
