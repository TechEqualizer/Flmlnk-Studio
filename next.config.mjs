/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/r/:slug*",
        headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(self)" }],
      },
    ];
  },
};
export default nextConfig;
