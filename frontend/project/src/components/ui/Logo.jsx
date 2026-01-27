import { Link } from "react-router-dom";
import "../../styles/components/logo.css";

export default function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-text">
        Farm<span>2</span><span>Market</span>
      </span>
    </Link>
  );
}
