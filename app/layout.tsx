import type { Metadata } from 'next';
import './globals.css';
import ThemePullCord from '@/components/theme/ThemePullCord';
import StatusBar from '@/components/StatusBar';

export const metadata: Metadata = {
  title: 'Three Paths — ML, DL, RL',
  description:
    'Learn machine learning, deep learning, and reinforcement learning by running every idea in the browser.',
};

/**
 * Sets data-theme before first paint so a saved theme never flashes the
 * default palette on load.
 */
const noFlashScript = `
(function(){
  try {
    var t = localStorage.getItem('anime-ml-theme');
    document.documentElement.setAttribute('data-theme', t || 'cyber-mecha');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'cyber-mecha');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="cyber-mecha" suppressHydrationWarning>
      <head>
        {/*
          Fonts load at runtime via stylesheet rather than through next/font,
          so a build machine without network access still succeeds.
          globals.css declares system-font fallbacks for offline use.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="pb-12">
        <ThemePullCord />
        {children}
        <StatusBar />
      </body>
    </html>
  );
}
