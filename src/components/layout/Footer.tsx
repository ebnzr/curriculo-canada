export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 bg-background text-sm text-muted-foreground w-full">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 max-w-7xl mx-auto">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} CurrículoCanadá. Otimize seu currículo com inteligência analítica.
        </p>
        <nav aria-label="Links do rodapé">
          <ul className="flex gap-4 list-none m-0 p-0">
            <li>
              <a href="/privacidade" className="hover:underline underline-offset-4">Privacidade</a>
            </li>
            <li>
              <a href="/termos" className="hover:underline underline-offset-4">Termos</a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
