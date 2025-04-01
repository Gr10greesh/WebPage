import { TextField, Select, MenuItem, Button } from '@mui/material';
import { useState } from "react";
import "./SearchFilters.css";

const SearchFilters = ({ onSearch, currentCategory }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(currentCategory || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ q: search, category });
  };

  return (
    <form className="search-filters" onSubmit={handleSubmit}>
      <TextField 
        label="Search Products" 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        variant="outlined"
        size="small"
      />
      
      <Select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="">All Categories</MenuItem>
        <MenuItem value="giftcard">Gift Cards</MenuItem>
        <MenuItem value="freefire">Free Fire</MenuItem>
        <MenuItem value="mobilegames">Mobile Games</MenuItem>
      </Select>
      
      <Button type="submit" variant="contained">
        Search
      </Button>
    </form>
  );
};

export default SearchFilters;