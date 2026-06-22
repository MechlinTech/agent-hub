export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
