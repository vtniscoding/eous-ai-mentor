export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header removed, profile moved to sidebar */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
