"use client";

import { useEffect, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from 'next/navigation';
import { getGameById } from "../../../features/gameSlice";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import Loader from "../../../components/Loader";

export default function GameDetail() {
    const { id } = useParams();

    const game = useSelector((state) => state.game.game);
    const isLoading = useSelector((state) => state.game.isLoading);

    const dispatch = useDispatch();

    useEffect(() => {
        if (id) {
            dispatch(getGameById(id));
        }
    }, [dispatch, id]);

    const showGameImage = (game) => {
        return `https://www.vgchartz.com${game.img}`;
    }

    return (
        <Fragment>
            <Header />
            <main className="container mx-auto px-4">
                {isLoading && <Loader />}
                {game && (
                    <div className="my-5 bg-white p-4 rounded-lg shadow-lg">
                        <h1 className="text-3xl font-bold text-center my-2">
                            {game.title}
                        </h1>
                        <div className="flex justify-center">
                            <img className="w-full max-w-md" src={showGameImage(game)} alt={game.title} />
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-base text-center bg-tan p-2 my-1">Console: {game.console}</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Genre: {game.genre}</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Publisher: {game.publisher}</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Developer: {game.developer}</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Critic Score: {game.critic_score}</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Total Sales: {game.total_sales}M</p>
                            <p className="text-base text-center bg-tan p-2 my-1">Release Date: {game.release_date}</p>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </Fragment>
    );
}
