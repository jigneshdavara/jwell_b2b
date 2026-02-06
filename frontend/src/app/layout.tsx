import type { Metadata } from "next";
import "./globals.css";
import { AuthMiddleware } from "@/middleware/authMiddleware";
import { StoreProvider } from "@/components/providers/StoreProvider";
import GlobalKycBlocker from "@/components/guards/GlobalKycBlocker";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopLoadingBar from "@/components/ui/TopLoadingBar";

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
                  <TopLoadingBar />
                  <GlobalKycBlocker />
                  <AuthMiddleware>
                    {children}
                  </AuthMiddleware>
                  <ToastContainer />
                </StoreProvider>
      </body>
    </html>
  );
}
