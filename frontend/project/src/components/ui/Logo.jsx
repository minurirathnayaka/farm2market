import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-text">Farm2Market</span>
    </Link>
  );
}
