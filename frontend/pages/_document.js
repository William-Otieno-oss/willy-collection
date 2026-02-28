import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap"
          as="style"
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Preload critical images */}
        <link rel="prefetch" href="/logo/air-force-1-black-and-white.webp" />
        <link
          rel="prefetch"
          href="/logo/air-jordan-1-retro-travis-scott.webp"
        />

        {/* DNS prefetch for API */}
        <link rel="dns-prefetch" href="http://localhost:4000" />

        {/* Favicon and theme */}
        <meta name="theme-color" content="var(--color-brand-dark)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Performance and SEO */}
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta
          name="description"
          content="Step into Style - Premium authentic sneaker collection"
        />
        <meta
          name="keywords"
          content="sneakers, shoes, Nike, Adidas, Puma, Jordan"
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="willy | Premium Sneaker Collection"
        />
        <meta
          property="og:image"
          content="/logo/air-force-1-black-and-white.webp"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
