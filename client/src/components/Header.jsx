export default function Header() {
  return (
    <header className="bg-[#121317] docked w-full px-6 py-4 flex flex-row-reverse justify-between items-center z-50 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-primary tracking-tight font-headline">المداد الذهبي</span>
      </div>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex flex-row-reverse gap-8 items-center">
          <a href="/" className="text-primary font-medium font-headline hover:text-primary/80">
            الرئيسية
          </a>
          <a href="#" className="text-outline font-medium font-headline hover:text-primary">
            خدماتنا
          </a>
          <a href="#" className="text-outline font-medium font-headline hover:text-primary">
            الأسعار
          </a>
        </nav>
        <button className="scale-95 active:opacity-80 transition-all">
          <span className="material-symbols-outlined text-primary text-3xl">menu</span>
        </button>
      </div>
    </header>
  )
}
