'use client';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/Components/Navbar/Navbar';
import Footer from '@/Components/Footer/Footer';
import ToastContainerWrapper from '@/Components/Toast/Toast';

// Lazy-load heavy floating component — not needed on first paint
const AIChat = dynamic(() => import('@/Components/AIChat/AIChat'), { ssr: false });

const HIDDEN_ROUTES = new Set(['/signin', '/forget-password', '/logout', '/404', '/not-found', '/signup']);

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '4px solid rgba(54,64,206,0.15)',
        borderTopColor: 'var(--main-color, #3640ce)',
        animation: 'shell-spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes shell-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const hide =
    HIDDEN_ROUTES.has(pathname) ||
    pathname?.startsWith('/adminDashboard') ||
    pathname === '/admin';

  return (
    <div className="app-wrapper">
      <ToastContainerWrapper />
      {!hide && <Navbar />}
      <main className="main-content">
        <Suspense fallback={<PageFallback />}>
          {children}
        </Suspense>
      </main>
      {!hide && <Footer />}
      {!hide && <AIChat />}
    </div>
  );
}
