import { Cairo } from 'next/font/google';
import './globals.css';
import './shared.css';
import ClientShell from './ClientShell';

const cairoFont = Cairo({
  variable: '--font-Cairo',
  subsets: ['latin', 'arabic'],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700', '800'],
  adjustFontFallback: false,
});

export const metadata = {
  title: 'Baby Tracker',
  description: 'Baby Tracker — Track your child\'s health, vaccines, doses, and appointments all in one place.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3640ce',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairoFont.variable}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
