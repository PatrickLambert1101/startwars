import React from "react";
import styled from "styled-components";
import Spinner from "./Spinner";
const SearchInputField = styled.input`
  border: 1px solid #cecece;
  border-radius: 1.5em;
  padding: 1em 2em;
  width: 60vw;
`;

const SearchInputWrap = styled.div`
 display: flex;
 align-items: center
`;
interface SearchInputI {
  loading: boolean;
  type:string,
  placeholder:string,
  onChange: (e: any)=>void,
  value: string,
}
export const SearchInput = ({
  loading,
  type,
  placeholder,
  onChange,
  value,
}: SearchInputI) => {
  return (
    <SearchInputWrap>
      <SearchInputField type={type} placeholder={placeholder} onChange={onChange} value={value} />
      {loading && <Spinner />}
    </SearchInputWrap>
  );
};
