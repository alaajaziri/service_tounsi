import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="bg-[#121317] docked w-full px-6 py-4 z-50 border-b border-outline-variant/10">
      <div className="flex flex-row-reverse justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-primary tracking-tight font-headline">المداد الذهبي</span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex flex-row-reverse gap-8 items-center">
            <Link to="/" className="text-primary font-medium font-headline hover:text-primary/80">
              الرئيسية
            </Link>
            <Link to="/beard" className="text-outline font-medium font-headline hover:text-primary">
              لحية + شعر
            </Link>
            <Link to="/fridge" className="text-outline font-medium font-headline hover:text-primary">
              الطبخ
            </Link>
          </nav>

          <button
            className="md:hidden scale-95 active:opacity-80 transition-all"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <nav className="md:hidden mt-4 border-t border-outline-variant/20 pt-4 pb-2 flex flex-col items-end gap-3">
          <Link to="/" className="text-on-surface font-medium" onClick={closeMobileMenu}>
            الرئيسية
          </Link>
          <Link to="/beard" className="text-on-surface font-medium" onClick={closeMobileMenu}>
            لحية + شعر
          </Link>
          <Link to="/fridge" className="text-on-surface font-medium" onClick={closeMobileMenu}>
            الطبخ
          </Link>
          <Link to="/car" className="text-on-surface font-medium" onClick={closeMobileMenu}>
            السيارة
          </Link>
          <Link to="/outfit" className="text-on-surface font-medium" onClick={closeMobileMenu}>
            اللبسة
          </Link>
        </nav>
      ) : null}
    </header>
  )
}
