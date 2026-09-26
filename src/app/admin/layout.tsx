import { redirect } from "next/navigation";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { AdminShell, type AdminUser } from "@/components/streamverse/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: AdminUser;
  try {
    const u = await requireAdmin();
    user = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    };
  } catch (err) {
    if (isAuthError(err)) {
      redirect("/login?redirect=/admin");
    }
    throw err;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
