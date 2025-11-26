/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/job-board",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: "/job-board",
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/job-board",
        permanent: false,
        basePath: false, // match root without basePath to avoid loops
      },
    ];
  },
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    const rewrites = [
      {
        source: "/ph/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
    ];

    if (!apiBaseUrl || ["undefined", "null"].includes(apiBaseUrl.toLowerCase())) {
      console.warn("NEXT_PUBLIC_API_URL is not defined; skipping /api rewrite.");
      return rewrites;
    }

    const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, "");

    if (!/^https?:\/\//i.test(normalizedApiBaseUrl)) {
      console.warn(
        "NEXT_PUBLIC_API_URL must start with http:// or https://; skipping /api rewrite.",
      );
      return rewrites;
    }

    rewrites.push({
      source: "/api/v1/:path*",
      destination: `${normalizedApiBaseUrl}/:path*`,
    });

    return rewrites;
  },
};

export default nextConfig;
