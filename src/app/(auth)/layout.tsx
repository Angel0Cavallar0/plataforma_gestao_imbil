import { AuthHashHandler } from "@/components/auth/auth-hash-handler";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center overflow-y-auto bg-muted/30 p-4">
      <AuthHashHandler>{children}</AuthHashHandler>
    </div>
  );
}
