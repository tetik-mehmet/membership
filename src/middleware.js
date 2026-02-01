import { NextResponse } from 'next/server';

// Edge Runtime'da bcrypt/node modülleri çalışmaz; sadece cookie varlığı kontrol edilir.
// Token doğrulaması dashboard layout (Node) tarafında yapılır.
export async function middleware(request) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // /dashboard/* için cookie yoksa login'e yönlendir
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Login sayfasında cookie varsa dashboard'a yönlendir (geçerli token layout'ta kontrol edilir)
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
