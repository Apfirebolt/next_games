import Footer from "../components/Footer";
import Header from "../components/Header";
import Image from "next/image";
import { Fragment } from "react";

export default function Home() {
  return (
    <Fragment>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold text-center">
            Welcome to <a href="https://nextjs.org">Next.js!</a>
          </h1>
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}