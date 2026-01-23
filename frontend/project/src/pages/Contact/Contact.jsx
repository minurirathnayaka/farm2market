import { Link } from "react-router-dom";
import "../../styles/style.css";
import "../../styles/contact.css";

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent (mock)");
  };

  return (
    <>
      <section className="contact-hero">
        <div className="contact-hero-overlay" />
        <div className="contact-hero-content">
          <h1>Contact Us</h1>
          <p>Get in touch with the Farm2Market team</p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container contact-grid">
          <div className="contact-info glass">
            <div className="info-item">
              <h3>Address</h3>
              <p>
                123 Agricultural Lane<br />
                Farm Valley<br />
                Sri Lanka
              </p>
            </div>

            <div className="info-item">
              <h3>Phone</h3>
              <p>
                +94 77 123 4567<br />
                +94 71 987 6543
              </p>
            </div>

            <div className="info-item">
              <h3>Email</h3>
              <p>
                info@farm2market.lk<br />
                support@farm2market.lk
              </p>
            </div>

            <div className="info-item">
              <h3>Hours</h3>
              <p>
                Mon–Fri: 9 AM–6 PM<br />
                Sat: 10 AM–4 PM<br />
                Sun: Closed
              </p>
            </div>
          </div>

          <form className="contact-form glass" onSubmit={handleSubmit}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <input type="text" placeholder="Subject" required />
            <textarea placeholder="Your Message" rows="6" required />
            <button className="btn btn-primary btn-full">
              Send Message
            </button>
          </form>
        </div>
      </section>

    </>
  );
}
