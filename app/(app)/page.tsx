"use client";

import SearchResults from "@/components/SearchResults";
import { useState } from "react";

export default function Home() {
  const [showResults, setShowResults] = useState(false);

  return (
    <section className={showResults ? "hero hero-results" : "hero"}>
      <div className="hero-group">
        <SearchResults onResultsChange={setShowResults} />
      </div>
    </section>
  );
}


