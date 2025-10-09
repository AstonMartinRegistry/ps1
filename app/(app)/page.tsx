export default function Home() {
  return (
    <section className="hero">
      <div className="hero-group">
        <div className="hero-title-wrap">
          <h1 className="hero-title">the registry</h1>
        </div>
        <div className="hero-search-wrap">
          <form className="search-box" action="#" role="search">
            <input
              className="search-input"
              type="search"
              placeholder="Search..."
              aria-label="Search"
            />
          </form>
        </div>
      </div>
    </section>
  );
}


