import Footer from "../components/Footer";
import Header from "../components/Header";
import { Fragment } from "react";

export default function Home() {
  return (
    <Fragment>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold text-center">
            Welcome to games app!
          </h1>
          <p className="my-2 texl-lg">Find your favorite games here</p>
          <p className="my-2">You have 60K Games to search from. The following API is used for fecthing the game related data 
            <a href="https://softgenie.org/api/games"> Softgenie API</a>
          </p>
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}