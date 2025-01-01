"use client";

import { useEffect, useState, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getGames } from "../../features/gameSlice";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Pagination from "../../components/Pagination";

export default function Games() {

  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);
  const [currentPage, setCurrentPage] = useState(1);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getGames());
  }, [dispatch]);

  const showGameImage = (game) => {
    return `https://www.vgchartz.com${game.img}`;
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    dispatch(getGames(page));
  }

  return (
    <Fragment>
      <Header />
      <main className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center my-5">
          Games
        </h1>
        {gameList && gameList.count && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(gameList.count / 25)} 
            onPageChange={handlePageChange} 
          />
        )}
        {isLoading && <p>Loading...</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameList && gameList.results && gameList.results.map((game) => (
            <div key={game.id} className="max-w-sm rounded overflow-hidden shadow-lg text-neutral-100 bg-carafe m-4">
              <img className="w-full" src={showGameImage(game)} alt={game.title} />
              <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">{game.title}</div>
                <p className="text-base">Console: {game.console}</p>
                <p className="text-base">Genre: {game.genre}</p>
                <p className="text-base">Publisher: {game.publisher}</p>
                <p className="text-base">Developer: {game.developer}</p>
                <p className="text-base">Critic Score: {game.critic_score}</p>
                <p className="text-base">Total Sales: {game.total_sales}M</p>
                <p className="text-base">Release Date: {game.release_date}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}
