"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Badge }  from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

type UserRole = "ADMIN" | "MEDIA";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type FormState = { name: string; email: string; role: UserRole; password: string };

const ROLES: UserRole[] = ["ADMIN", "MEDIA"];

const roleBadgeClass: Record<UserRole, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20",
  MEDIA: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20",
};

const emptyForm: FormState = { name: "", email: "", role: "MEDIA", password: "" };

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers]             = useState<User[]>(initialUsers);
  const [open, setOpen]               = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm]               = useState<FormState>(emptyForm);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingUser) {
        const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated: User = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const created: User = await res.json();
        setUsers((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Failed to delete user.");
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {users.length} member{users.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground uppercase text-xs tracking-wider">
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Email</th>
              <th className="px-6 py-3 text-left font-medium">Role</th>
              <th className="px-6 py-3 text-left font-medium">Joined</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No users yet. Add your first team member.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={roleBadgeClass[user.role]}>
                    {user.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                placeholder="e.g. John Santos"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="e.g. john@church.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                {editingUser && (
                  <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                required={!editingUser}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingUser ? "Save Changes" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
