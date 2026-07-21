import Link from "next/link";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1f1a14]/[0.08] bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1f1a14]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#d9622b] to-[#b04d18] text-[10px] text-white shadow-[0_0_14px_rgba(217,98,43,0.32)]">
            ▲
          </span>
          Ascend
        </Link>
        <div className="hidden items-center gap-8 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#6b6155] transition-colors hover:text-[#1f1a14]"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#6b6155] transition-colors hover:text-[#1f1a14]"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-b from-[#2a231b] to-[#1f1a14] px-4 py-1.5 text-sm font-medium text-[#f7f1e6] shadow-[0_8px_24px_rgba(31,26,20,0.24)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
