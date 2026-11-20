import Link from 'next/link'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="relative mx-auto mt-24 max-w-7xl px-4 pb-10 sm:px-8">
      <div className="grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="flex items-center gap-2.5 text-lg font-medium tracking-wide">
            <Logo className="h-9 w-9" /> Crumb & Cloud
          </p>
          <p className="max-w-sm leading-relaxed text-mist">
            A demo bakery built to show what real-time 3D on the web looks like in 2026. Nothing here is for
            sale: no order is sent anywhere and no payment is taken.
          </p>
        </div>
        <nav aria-label="Footer" className="space-y-3">
          <p className="eyebrow">Visit</p>
          <ul className="space-y-2">
            <li>
              <Link className="hover:text-moon" href="/design">
                Build a cake
              </Link>
            </li>
            <li>
              <Link className="hover:text-moon" href="/menu">
                The vitrine
              </Link>
            </li>
            <li>
              <Link className="hover:text-moon" href="/#story">
                How it is made
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-3">
          <p className="eyebrow">Made by</p>
          <ul className="space-y-2">
            <li>
              <a className="hover:text-moon" href="https://kietnguyen.io.vn" rel="author">
                Kiệt Nguyễn, frontend developer
              </a>
            </li>
            <li>
              <a className="hover:text-moon" href="https://github.com/kiet0807/bakery-3d">
                Source code on GitHub
              </a>
            </li>
            <li className="text-sm text-haze">
              Fonts: Barlow, Barlow Condensed, Pacifico (SIL OFL). Light: “Comfy Café” by Sergej Majboroda,
              Poly Haven (CC0).
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
