import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) => {
  return (
    <div className="search-filter-container glass-panel">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Dropdown */}
      <div className="filter-group">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="All Categories">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Books">Books</option>
          <option value="Home">Home</option>
        </select>

        {/* Sort Dropdown (Bonus) */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
        >
          <option value="">Sort by Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
