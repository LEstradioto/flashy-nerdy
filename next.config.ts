import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: 'standalone', // this is good for docker deployments
  // output: 'export', // this is good for vercel deployments

  /* config options here */

};

export default nextConfig;
