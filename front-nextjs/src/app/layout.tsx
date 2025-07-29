import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geoview - WhatsApp Bot",
  description: "Geoview - WhatsApp Bot Connection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
