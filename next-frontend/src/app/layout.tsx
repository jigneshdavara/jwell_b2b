import type { Metadata } from "next";
import "./globals.css";
import { AuthMiddleware } from "@/middleware/authMiddleware";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                    className="!top-12 !right-1 sm:!top-4 sm:!right-4"
                    toastClassName="!mb-2 !rounded-lg !shadow-xl !min-h-[48px] sm:!min-h-[60px] !text-xs sm:!text-sm !px-3 !py-2.5 sm:!px-4 sm:!py-3 !max-w-[calc(100vw-0.5rem)] sm:!max-w-md !border !border-slate-200/50 [&_.Toastify__toast-body]:!m-0 [&_.Toastify__toast-body]:!text-xs sm:[&_.Toastify__toast-body]:!text-sm [&_.Toastify__toast-body]:!flex [&_.Toastify__toast-body]:!items-center [&_.Toastify__toast-body]:!flex-1 [&_.Toastify__toast-body]:!min-w-0 [&_.Toastify__progress-bar]:!h-[2px] sm:[&_.Toastify__progress-bar]:!h-1"
                  />
                </StoreProvider>
      </body>
    </html>
  );
}
