'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type NavItem = {
  label: string;
  href: string;
  activeFor?: string[];
  icon: (className: string) => JSX.Element;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Explore',
    href: '/explore',
    icon: (className) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 7-7 11-7-11 7-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7l3 3-3 5-3-5 3-3z" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    href: '/group',
    activeFor: ['/group', '/event'],
    icon: (className) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: 'Home',
    href: '/swipe',
    activeFor: ['/swipe'],
    icon: (className) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-7 9 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    label: 'Chats',
    href: '/chat',
    icon: (className) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v10H8l-4 4V5z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (className) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
      </svg>
    ),
  },
];

const HIDE_ROUTES = ['/', '/onboarding'];
const HIDE_PREFIXES = ['/match'];

const isActiveRoute = (pathname: string, item: NavItem) => {
  const matches = item.activeFor ?? [item.href];
  return matches.some((route) => pathname === route || (route !== '/' && pathname.startsWith(route)));
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideToolbar = HIDE_ROUTES.includes(pathname) || HIDE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className={hideToolbar ? 'min-h-screen' : 'toolbar-safe'}>
      {children}
      {!hideToolbar && (
        <nav className="fixed left-0 right-0 bottom-0 z-50 sm:left-1/2 sm:right-auto sm:bottom-[50px] sm:-translate-x-1/2">
          <div className="w-full rounded-none border-t border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:w-[min(92vw,520px)] sm:rounded-3xl sm:border">
            <div className="flex items-center justify-between gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActiveRoute(pathname, item);
                const iconClass = 'h-5 w-5';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className="flex-1"
                  >
                    <span
                      className={
                        `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ` +
                        (active
                          ? 'text-[var(--primary)] bg-[var(--background)] shadow-[0_8px_20px_rgba(5,102,97,0.18)]'
                          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]')
                      }
                    >
                      {item.icon(iconClass)}
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
