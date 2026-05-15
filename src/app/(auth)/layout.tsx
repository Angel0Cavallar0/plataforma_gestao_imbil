export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto bg-muted/30 p-4">
      {children}
    </div>
  );
}
