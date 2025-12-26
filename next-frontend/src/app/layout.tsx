import type { Metadata } from "next";
import "./globals.css";
import { AuthMiddleware } from "@/middleware/authMiddleware";
import { StoreProvider } from "@/components/providers/StoreProvider";

export const metadata: Metadata = {
  title: "Jwell B2B Platform",
  description: "Luxury B2B Jewelry Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <StoreProvider>
          <AuthMiddleware>
            {children}
          </AuthMiddleware>
        </StoreProvider>
      </body>
    </html>
  );
}
