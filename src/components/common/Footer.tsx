import Link from 'next/link';
import { AnimatedLogo } from './AnimatedLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 glass-card-solid mt-auto" style={{ borderRadius: 0 }}>
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-3 sm:mb-4">
              <AnimatedLogo size="lg" showAnimation={true} />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              Fenerbahçe futbol takımının maç sonuçları, istatistikleri, kadro bilgileri ve 
              canlı skor takibi.
            </p>
            <div className="flex items-center gap-4 mt-3 sm:mt-4">
              <a 
                href="https://twitter.com/fenerblog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-fb-yellow transition-colors p-2 -m-2"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-fb-yellow mb-3 sm:mb-4 text-sm sm:text-base">SAYFALAR</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/maclar" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  Maçlar
                </Link>
              </li>
              <li>
                <Link href="/turnuvalar" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  Turnuvalar
                </Link>
              </li>
              <li>
                <Link href="/kadro" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  Kadro
                </Link>
              </li>
              <li>
                <Link href="/transferler" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  Transferler
                </Link>
              </li>
              <li>
                <Link href="/istatistik" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  İstatistikler
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-fb-yellow mb-3 sm:mb-4 text-sm sm:text-base">BİLGİ</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  Hakkında
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors inline-block py-1">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            © {currentYear} Fener.co - Tüm hakları saklıdır.
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600 text-center sm:text-right">
            Bu site Fenerbahçe SK ile bağlantılı değildir.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
