import Link from 'next/link';

const FOOTER_NAV = [
  {
    title: 'Explore',
    links: [
      { label: 'All Games', href: '/games' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Forums', href: '/forums' },
      { label: 'Recommendations', href: '/recommendation' },
      { label: 'About Us', href: '/about' },
      { label: 'News & Updates', href: '/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/support' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

const LEGAL_LINKS = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brown/30 bg-carafe text-sand">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand & Description */}
          <div className="space-y-4 md:col-span-2">
            <Link 
              href="/" 
              className="inline-block text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
            >
              Level Vault
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-tan">
              Crafting immersive digital gaming experiences with performance-first design and modern technology.
            </p>
          </div>

          {/* Dynamic Navigation Sections */}
          {FOOTER_NAV.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brown/20 pt-8 text-xs text-tan sm:flex-row">
          <p>&copy; {currentYear} Level Vault. All rights reserved.</p>
          
          <nav aria-label="Legal links" className="flex space-x-6">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;