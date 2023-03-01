import React from "react";
import styled from "styled-components";
import { Person } from "./SearchBar";

const ResultWrap = styled.div`
  width: 80%;
  border: 1px solid #cecece;
  border-radius: 1.5em;
  padding: 0.5em 1em;
  border-radius: 1.5em;
  font-size: 0.7em;
  margin-top: 0.5em;
`;
const RowWrap = styled.div`
  display: flex;
  justify-content: space-between;
  p {
    margin: 0.25em;
  }
`;
const Row = ({ title, val }: { title: string; val: string }) => (
  <RowWrap>
    <p>{title}:</p>
    <p>{val}</p>
  </RowWrap>
);
export const Result = ({ person }: { person: Person }) => {
  return (
    <ResultWrap>
      <Row title="Name" val={person.name} />
      <Row title="Height" val={person.height} />
      <Row title="Mass" val={person.mass} />
      <Row title="Hair Color" val={person.hair_color} />
      <Row title="Skin Color" val={person.skin_color} />
      <Row title="Eye Color" val={person.eye_color} />
      <Row title="Birth Year" val={person.birth_year} />
      <Row title="Gender" val={person.gender} />
    </ResultWrap>
  );
};
