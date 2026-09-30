// The layout preserves route children while preventing wide tables from stretching the dashboard shell.
export default function SharesLayout({children}: {children: React.ReactNode}) {
  return <div className="min-w-0">{children}</div>;
}
