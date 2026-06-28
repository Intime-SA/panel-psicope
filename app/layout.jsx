export const metadata = {
  title: "Consultorio Psicopedagógico",
  description: "Panel de gestión del consultorio",
};

// Viewport responsive para uso en celular (consultas rápidas).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4F7CAC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
