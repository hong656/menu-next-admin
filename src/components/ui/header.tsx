import { ChevronRight, Book } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex h-16 items-center border-b bg-white px-6">
      <nav className="flex items-center text-sm font-medium text-gray-500">
        <Book className="mx-2 h-4 w-4" />
        <a href="#" className="hover:text-gray-700">
          Home
        </a>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-800">Chat</span>
      </nav>
    </header>
  );
};

export default Header;