import { OrganizationsTable } from './OrganizationsTable';

export const dynamic = 'force-dynamic';

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organizations</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage church organizations and their members
        </p>
      </div>
      <OrganizationsTable />
    </div>
  );
}
