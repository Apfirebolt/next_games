import { Inter } from "next/font/google";
import "./globals.css";
import './main.css';
import StoreProvider from "./StoreProvider";

export const metadata = {
  title: "Games - Next.js",
  description: "This is a games database app built with Next.js",
};

const MainLayout = ({ children }) => {
  return (
    <html lang="en">
      <body className="bg-sand">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
};

export default MainLayout;
