import Link from 'next/link';

const Header = () => {
    return (
        <header className="bg-gray-800">
            <div className="container mx-auto flex justify-between items-center p-4">
                <h1 className="text-white text-2xl">My App</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link href="/" className="text-white hover:text-gray-300">Home</Link>
                        </li>
                        <li>
                            <Link href="/about" className="text-white hover:text-gray-300">About</Link>
                        </li>
                        <li>
                            <Link href="/games" className="text-white hover:text-gray-300">Games</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;