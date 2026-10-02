// LoansLayout preserves nested pages and stops wide financial tables from stretching the dashboard shell.
export default function LoansLayout({children}: {children: React.ReactNode}) {
  return <div className="min-w-0">{children}</div>;
}
