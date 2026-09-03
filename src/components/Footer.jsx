import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-carafe text-sand border-t border-brown/30">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand & Description */}
          <div className="space-y-4 md:col-span-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Next Games
            </span>
            <p className="max-w-sm text-sm text-tan leading-relaxed">
              Crafting immersive digital gaming experiences with performance-first design and modern technology.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/games" className="transition-colors hover:text-white">
                  All Games
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="transition-colors hover:text-white">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/recommendation" className="transition-colors hover:text-white">
                  Recommendations
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-white">
                  News & Updates
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Contact Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/support" className="transition-colors hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brown/20 pt-8 sm:flex-row text-xs text-tan">
          <p>&copy; {new Date().getFullYear()} Next Games. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;