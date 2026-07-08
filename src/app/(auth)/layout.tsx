export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] items-center justify-center app-shell-bg p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
