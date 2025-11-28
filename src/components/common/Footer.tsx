import Link from 'next/link';
import { AnimatedLogo } from './AnimatedLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <AnimatedLogo size="lg" showAnimation={true} />
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Fenerbahçe futbol takımının maç sonuçları, istatistikleri, kadro bilgileri ve 
              canlı skor takibi. API-Football v3 ile desteklenmektedir.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a 
                href="https://twitter.com/fenerblog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-fb-yellow transition-colors"
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
            <h4 className="font-display text-fb-yellow mb-4">SAYFALAR</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/maclar" className="text-gray-400 hover:text-white transition-colors">
                  Maçlar
                </Link>
              </li>
              <li>
                <Link href="/turnuvalar" className="text-gray-400 hover:text-white transition-colors">
                  Turnuvalar
                </Link>
              </li>
              <li>
                <Link href="/kadro" className="text-gray-400 hover:text-white transition-colors">
                  Kadro
                </Link>
              </li>
              <li>
                <Link href="/transferler" className="text-gray-400 hover:text-white transition-colors">
                  Transferler
                </Link>
              </li>
              <li>
                <Link href="/istatistik" className="text-gray-400 hover:text-white transition-colors">
                  İstatistikler
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-display text-fb-yellow mb-4">BİLGİ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.api-football.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  API-Football
                </a>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  Hakkında
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Fener.co - Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-gray-600">
            Veriler API-Football v3 tarafından sağlanmaktadır. Bu site Fenerbahçe SK ile bağlantılı değildir.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
