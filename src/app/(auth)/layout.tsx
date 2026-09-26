import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-black relative overflow-hidden">
      {/* Ambient crimson glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <header className="container mx-auto px-4 lg:px-8 py-6 relative z-10">
        <Link href="/" className="inline-flex items-center" aria-label={`${APP_NAME} home`}>
          <span className="text-primary font-black text-2xl tracking-tight">
            {APP_NAME.toUpperCase()}
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="container mx-auto px-4 lg:px-8 py-6 text-center text-xs text-muted-foreground relative z-10">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
