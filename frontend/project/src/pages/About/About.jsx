import { Link } from "react-router-dom";
import "../../styles/about.css";

export default function About() {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h2>
            Empowering Farmers.<br />
            Transforming Agriculture.
          </h2>
          <p>
            Bridging the gap between farmers and markets with real-time data
            and predictive insights.
          </p>
        </div>
      </section>

      <section className="content">
        <h3>About Farm2Market</h3>

        <div className="card-grid">
          <div className="info-card">
            <h4>Our Mission</h4>
            <p>
              To connect farmers directly with buyers using technology,
              real-time market data, and predictive analytics.
            </p>
          </div>

          <div className="info-card">
            <h4>Our Vision</h4>
            <p>
              A transparent, efficient agricultural ecosystem where farmers
              thrive and buyers access fresh produce.
            </p>
          </div>

          <div className="info-card">
            <h4>Why Farm2Market</h4>
            <ul>
              <li>Real-time price insights</li>
              <li>Direct farmer-to-buyer access</li>
              <li>No hidden commissions</li>
              <li>Efficient logistics coordination</li>
            </ul>
          </div>
        </div>
      </section>


    </>
  );
}
