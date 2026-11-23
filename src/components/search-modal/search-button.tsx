interface SearchButtonProps {
    loading?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    className?: string;
}

const SearchButton = ({ loading, onClick, children, className }: SearchButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={
                className ||
                "search-button pointer-events-auto cursor-pointer border border-[#8B5CF6]/40 text-lg mt-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl py-2.5 px-5 shadow-lg shadow-[#8B5CF6]/20 transition-all"
            }
        >
            {loading ? "Searching..." : children || "Find Properties"}
        </button>
    );
};

export default SearchButton;
