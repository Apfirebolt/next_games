import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import "./main.css";
import StoreProvider from "./StoreProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Level Vault — Track, Review & Discover Games",
    template: "%s | Level Vault",
  },
  description:
    "Crafting immersive digital gaming experiences. Sync your ratings, build your backlog, and track community leaderboards.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || "https://codelean.in"
  ),
};

function getInitialUser(cookieStore) {
  const rawUser = cookieStore.get("user")?.value;
  if (!rawUser) return null;

  try {
    return JSON.parse(decodeURIComponent(rawUser));
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const initialUser = getInitialUser(cookieStore);

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-carafe text-sand antialiased`}>
        <StoreProvider initialUser={initialUser}>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </StoreProvider>
      </body>
    </html>
  );
}