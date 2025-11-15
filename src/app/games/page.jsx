"use client";

import { useEffect, useState, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from 'next/link';
import gsap from 'gsap';
import { getGames } from "../../features/gameSlice";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";

export default function Games() {

  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getGames(1, ''));
  }, [dispatch]);

  const showGameImage = (game) => {
    return `https://www.vgchartz.com${game.img}`;
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = {
      page: page,
      search: searchText
    };
    dispatch(getGames(params));
  }

  // apply gsap animation
  useEffect(() => {
    gsap.from('.break-inside-avoid', { opacity: 0, x: -100, duration: 1, stagger: 0.2, ease: 'power3.inOut' });
  }, []);

  // debounce search here
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      
      const params = {
        page: currentPage,
        search: searchText
      };
      dispatch(getGames(params));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  return (
    <Fragment>
      <Header />
      <main className="container mx-auto px-4">
        <div className="my-5 bg-white p-4 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center my-2">
            Games
          </h1>
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Search games..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-4 py-2 border rounded-lg w-full max-w-xl mx-auto"
            />
          </div>
        </div>
        {gameList && gameList.count && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(gameList.count / 25)} 
            onPageChange={handlePageChange} 
          />
        )}
        {isLoading && <Loader />}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {gameList && gameList.results && gameList.results.map((game) => (
            <div 
              key={game.id} 
              className="break-inside-avoid max-w-sm rounded shadow-lg text-neutral-100 bg-carafe mb-4"
              style={{ height: `${Math.floor(Math.random() * 200) + 300}px` }}
            >
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
                <Link href={`/games/${game.id}`} className="hover:underline bg-tan text-neutral-100 text-center rounded p-2 mt-2 block">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}
