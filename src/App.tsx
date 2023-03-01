import React from "react";
import logo from "./logo.svg";
import "./App.css";
import SearchBar from "./components/SearchBar";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <SearchBar></SearchBar>
      </header>
    </div>
  );
}

export default App;
