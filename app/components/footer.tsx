// Footer identifies the current year and the staff portal at the end of each dashboard page.
const Footer = () => {
  return (
    <footer className="mt-auto border-t px-4 py-4 text-sm text-muted-foreground sm:px-7 lg:px-9">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
        <span>© {new Date().getFullYear()} Caritas</span>
        <span>Internal staff portal</span>
      </div>
    </footer>
  );
};

export default Footer;
