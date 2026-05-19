'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import './PageTransition.css';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter-active');
    // trigger reflow
    void el.offsetWidth;
    el.classList.add('page-enter-active');
  }, [pathname]);

  return (
    <div ref={ref} className="page-transition">
      {children}
    </div>
  );
}
