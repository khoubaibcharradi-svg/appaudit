import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin dev requests by default (localhost only),
  // which breaks hydration/API calls when other workstations load the app
  // via the dev server's LAN address. The Origin header on every such
  // request is this server's own address (not the client's), so listing it
  // here covers every workstation on the network. Update this if the
  // server's LAN IP changes.
  allowedDevOrigins: ["192.168.1.11"],
};

export default nextConfig;
