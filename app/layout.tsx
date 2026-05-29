// app/layout.tsx
import React from 'react';
import type { Metadata } from 'next'; // 💡 Importamos el tipo oficial de Next.js

// 💡 Tipamos la constante de metadata
export const metadata: Metadata = {
  title: '🎭 ¡Impro Match! 🎬',
  description: 'Saca al actor amateur que llevas dentro entrenando tu voz.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        backgroundColor: '#2c3e50',
        fontFamily: '"Fredoka", sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {children}
      </body>
    </html>
  );
}