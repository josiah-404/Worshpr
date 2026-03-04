import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PresentationsTable from "./PresentationsTable";

export const dynamic = "force-dynamic";

export default async function WorshipPage() {
  const presentations = await prisma.presentation.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Worship Screen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your presentation setlists
          </p>
        </div>
        <Link href="/worship/editor">
          <button className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors">
            <Plus className="h-4 w-4" />
            New Presentation
          </button>
        </Link>
      </div>

      <PresentationsTable presentations={presentations as any} />
    </div>
  );
}
