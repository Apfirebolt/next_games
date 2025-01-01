import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";

export const metadata = {
  title: "Spotify Clone - Next.js",
  description: "This is a spotify clone built with Next.js",
};

const MainLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
};

export default MainLayout;
