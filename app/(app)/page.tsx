"use client";

import SearchResults from "@/components/SearchResults";
import { useState } from "react";

export default function Home() {
  const [showResults, setShowResults] = useState(false);

  return (
    <section className={showResults ? "hero hero-results" : "hero"}>
      <div className="hero-group">
        {!showResults && (
          <div className="hero-title-wrap">
            <h1 className="hero-title">
              <span className="blue-square"></span>
              theregistry
            </h1>
          </div>
        )}
        <SearchResults onResultsChange={setShowResults} />
      </div>
    </section>
  );
}


