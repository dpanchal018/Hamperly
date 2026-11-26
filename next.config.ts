import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The storefront is a single page. Old page URLs (shared links, bookmarks, search results)
  // land on the matching section or overlay of "/" instead. Query strings are passed through.
  async redirects() {
    return [
      { source: '/hampers', destination: '/?section=shop', permanent: false },
      { source: '/hampers/:id', destination: '/?hamper=:id', permanent: false },
      { source: '/products', destination: '/?section=shop', permanent: false },
      { source: '/products/:slug', destination: '/?section=studio', permanent: false },
      { source: '/occasions', destination: '/?section=occasions', permanent: false },
      { source: '/occasions/:slug', destination: '/?occasion=:slug', permanent: false },
      { source: '/events/:slug', destination: '/?event=:slug', permanent: false },
      { source: '/build', destination: '/?section=studio', permanent: false },
      { source: '/exhibitions', destination: '/?section=museum', permanent: false },
      { source: '/museum', destination: '/?section=museum', permanent: false },
      { source: '/checkout', destination: '/?checkout=1', permanent: false },
      { source: '/account', destination: '/?account=orders', permanent: false },
      { source: '/account/:tab(orders|wishlist|profile|notifications)', destination: '/?account=:tab', permanent: false },
      { source: '/account/invoices', destination: '/?account=orders', permanent: false },
      { source: '/login', destination: '/?auth=login', permanent: false },
      { source: '/signup', destination: '/?auth=signup', permanent: false },
      { source: '/policies/:path*', destination: '/?policy=returns', permanent: false },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'xgezyhyjfouoqmwcypmr.supabase.co',
      }
    ],
  },
};

export default nextConfig;
