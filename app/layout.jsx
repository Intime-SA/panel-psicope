export const metadata = {
  title: "Consultorio Psicopedagógico",
  description: "Panel de gestión del consultorio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
