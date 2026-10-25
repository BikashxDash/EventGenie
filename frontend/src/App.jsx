import React from "react";
import Home from "./pages/Home";
import "./index.css";

export default function App() {
  return (
    <>
      {/* Ambient background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* App content */}
      <Home />
    </>
  );
}
