import "../../styles/about.css";

export default function About() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">About Farm2Market</span>
          <h2>
            Empowering Farmers.<br />
            Transforming Agriculture.
          </h2>
          <p>
            We connect farmers directly with buyers using real-time data,
            predictive insights, and transparent market access.
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section className="content">
        <div className="card-grid">
          <div className="info-card">
            <h4>The Problem</h4>
            <p>
              Farmers often sell blindly, relying on middlemen and outdated
              price information. This creates unfair pricing and waste.
            </p>
          </div>

          <div className="info-card">
            <h4>Our Solution</h4>
            <p>
              Farm2Market provides real-time pricing, predictive analytics,
              and direct access to buyers — removing uncertainty.
            </p>
          </div>

          <div className="info-card">
            <h4>The Impact</h4>
            <ul>
              <li>Fairer farmer income</li>
              <li>Reduced food waste</li>
              <li>Faster logistics</li>
              <li>Transparent pricing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stat">
          <strong>100%</strong>
          <span>100% Transparent Pricing</span>
        </div>
        <div className="stat">
          <strong>0%</strong>
          <span>No Hidden Commissions</span>
        </div>
        <div className="stat">
          <strong>24/7</strong>
          <span> 24/7 Market Visibility</span>
        </div>
      </section>

      {/* VISION */}
      <section className="vision">
        <h3>Looking Ahead</h3>
        <p>
          Our vision is a future where agriculture is data-driven, fair,
          and sustainable — empowering farmers at every step.
        </p>
      </section>
    </>
  );
}
