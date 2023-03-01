import React from "react";
import {  render, screen } from "@testing-library/react";
import App from "./App";
import userEvent from "@testing-library/user-event";

test("renders search", () => {
  render(<App />);
  const linkElement = screen.getByTestId("search");
  expect(linkElement).toBeInTheDocument();
});
test("typing shows loader", async () => {
  render(<App />);
  const input = screen.getByTestId("search");
   userEvent.click(input);
   userEvent.type(input, '123')
  const noResults = screen.getByTestId("loader");
  expect(noResults).toBeInTheDocument();
});
