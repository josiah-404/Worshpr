import { useState } from "react";

export type UserRole = "ADMIN" | "MEDIA";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type UserFormState = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

export const EMPTY_USER_FORM: UserFormState = {
  name: "", email: "", role: "MEDIA", password: "",
};

export function useUsers(initialUsers: User[]) {
  const [users, setUsers]     = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function createUser(form: UserFormState) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created: User = await res.json();
      setUsers((prev) => [created, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(id: string, form: UserFormState) {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, string> = {
        name: form.name, email: form.email, role: form.role,
      };
      if (form.password) body.password = form.password;
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: User = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Failed to delete user.");
    }
  }

  return { users, loading, error, setError, createUser, updateUser, deleteUser };
}
