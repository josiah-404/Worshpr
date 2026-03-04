import { prisma } from "@/lib/prisma";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage worship team members and their roles
        </p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  );
}
