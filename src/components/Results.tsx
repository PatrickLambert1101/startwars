import React from "react";
import styled from "styled-components";
import { Person } from "./SearchBar";
import { Result } from "./Result";
const ResultsWrapper = styled.div`
  width: 60vw;
  display: flex;
  flex-direction: column;
  margin: 1em auto;
  align-items: center;
`;

interface ResultsI {
  data?: Person[];
  resultStatus?: string;
  numberOfChars: number;
}
const Results = ({ data, numberOfChars, resultStatus }: ResultsI) => {
  if (
    data &&
    (data.length > 0 || resultStatus === "FETCHING") &&
    numberOfChars > 1
  ) {
    return (
      <ResultsWrapper>
        {data.map((person) => (
          <Result key={person.name} person={person} />
          ))}
      </ResultsWrapper>
    );
  } else if (numberOfChars > 1) {
    return <p>No results available...</p>;
  } else {
    return <></>;
  }
};

export default Results;
