"use client";

import { useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getGames } from "../../features/gameSlice";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

export default function Games() {

  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getGames());
  }, [dispatch]);

  const showGameImage = (game) => {
    return `https://www.vgchartz.com${game.img}`;
  }

  return (
    <Fragment>
      <Header />
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center my-5">
          Games
        </h1>
        {isLoading && <p>Loading...</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameList && gameList.results && gameList.results.map((game) => (
            <div key={game.id} className="max-w-sm rounded overflow-hidden shadow-lg m-4">
              <img className="w-full" src={showGameImage(game)} alt={game.title} />
              <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">{game.title}</div>
                <p className="text-gray-700 text-base">Console: {game.console}</p>
                <p className="text-gray-700 text-base">Genre: {game.genre}</p>
                <p className="text-gray-700 text-base">Publisher: {game.publisher}</p>
                <p className="text-gray-700 text-base">Developer: {game.developer}</p>
                <p className="text-gray-700 text-base">Critic Score: {game.critic_score}</p>
                <p className="text-gray-700 text-base">Total Sales: {game.total_sales}M</p>
                <p className="text-gray-700 text-base">Release Date: {game.release_date}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}
