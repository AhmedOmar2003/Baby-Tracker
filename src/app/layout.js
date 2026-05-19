import { Cairo } from 'next/font/google';
import './globals.css';
import './shared.css';
import ClientShell from './ClientShell';

const cairoFont = Cairo({
  variable: '--font-Cairo',
  subsets: ['latin', 'arabic'],
  display: 'swap',
  preload: true,
  weight: ['400', '600', '700'],
});

export const metadata = {
  title: 'Baby Tracker',
  description: 'Baby Tracker — Track your child\'s health, vaccines, doses, and appointments all in one place.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3640ce',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cairoFont.variable}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
