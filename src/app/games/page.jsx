"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getGames } from "../../features/gameSlice";

export default function Games() {

  const gameList = useSelector((state) => state.game.gameList);
  const isLoading = useSelector((state) => state.game.isLoading);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getGames());
  }, [dispatch]);

  console.log('Gamelist ', gameList)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center text-red-700">
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <p>Welcome to the Game page</p>
        {isLoading && <p>Loading...</p>}
        {gameList && gameList.results && gameList.results.map((game) => (
          <div key={game.id} className="flex flex-col items-center">
            <h2>{game.title}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
