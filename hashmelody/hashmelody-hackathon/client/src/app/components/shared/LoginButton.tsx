interface LoginButtonProps {
    onClick: () => void;
  }
  
  export function LoginButton({ onClick }: LoginButtonProps) {
    return (
      <button
        onClick={onClick}
        className="rounded-full bg-white text-black px-6 py-3 font-medium 
                   hover:bg-gray-100 transition-colors duration-200"
      >
        Connect Wallet
      </button>
    );
  }