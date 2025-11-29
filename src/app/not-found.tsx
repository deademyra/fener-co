import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-bold text-8xl text-fb-navy mb-4">404</h1>
        <h2 className="font-bold text-2xl text-white mb-4">Sayfa Bulunamadı</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link href="/" className="btn btn-primary">
          Anasayfaya Dön
        </Link>
      </div>
    </div>
  );
}
