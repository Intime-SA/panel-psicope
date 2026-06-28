/** @type {import('next').NextConfig} */
const nextConfig = {
  // Servimos el dashboard (HTML estático en /public/dashboard.html) en la raíz "/".
  // beforeFiles se evalúa antes del filesystem, así "/" entrega el dashboard
  // mientras /api/* sigue siendo manejado por las rutas de la API.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/dashboard.html" }],
    };
  },
  // Las imágenes de sesiones viajan como base64 dentro del estado.
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

module.exports = nextConfig;
