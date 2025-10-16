import SearchResults from "@/components/SearchResults";

export default function Home() {
  return (
    <section className="hero">
      <div className="hero-group">
        <div className="hero-title-wrap">
          <h1 className="hero-title">the registry</h1>
        </div>
        <SearchResults />
      </div>
    </section>
  );
}


