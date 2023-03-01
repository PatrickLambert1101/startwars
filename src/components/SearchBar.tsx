import React, { useState } from "react";
import Results from "./Results";
import { useFetch } from "../hooks/useFetch";
import { SearchInput } from "./SearchInput";

import styled from "styled-components";
export interface Person {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
}
const SearchPageWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
  justify-content: flex-start;
`;
function SearchBar() {
  const [query, setQuery] = useState("");

  const url = query && `https://swapi.dev/api/people/?search=${query}`;

  const { status, data, error } = useFetch(url, query.length);
  if (error) {
    return <div>Error</div>;
  }

  return (
    <SearchPageWrap>
      <SearchInput
        loading={status === "FETCHING"}
        type="email"
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
        value={query}
      />

      <Results data={data} numberOfChars={query.length} resultStatus={status} />
    </SearchPageWrap>
  );
}

export default SearchBar;
