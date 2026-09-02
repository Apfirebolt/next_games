import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "./globals.css";
import "./main.css";
import StoreProvider from "./StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Games - Next.js",
  description: "This is a games database app built with Next.js",
};

export default async function MainLayout({ children }) {
  // Read auth cookie on the server
  const cookieStore = await cookies();
  const rawUser = cookieStore.get("user")?.value;
  let initialUser = null;

  if (rawUser) {
    try {
      // Decode URI component in case the cookie value was encoded by js-cookie
      initialUser = JSON.parse(decodeURIComponent(rawUser));
    } catch {
      initialUser = null;
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-sand`}>
        <StoreProvider initialUser={initialUser}>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </StoreProvider>
      </body>
    </html>
  );
}