import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import "../../styles/components/public-nav.css";

export default function PublicNav() {
  const location = useLocation();
  const navRef = useRef(null);
  const bubbleRef = useRef(null);

  const base = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Anchor bubble to active route
  useEffect(() => {
    const nav = navRef.current;
    const bubble = bubbleRef.current;
    if (!nav || !bubble) return;

    const active = nav.querySelector(".nav-link.active");
    if (!active) return;

    const rect = active.getBoundingClientRect();
    const parent = nav.getBoundingClientRect();

    const padX = 12;
    const padY = 6;

    base.current = {
      w: rect.width + padX * 2,
      h: rect.height + padY * 2,
      x: rect.left - parent.left - padX,
      y: rect.top - parent.top - padY,
    };

    bubble.style.width = `${base.current.w}px`;
    bubble.style.height = `${base.current.h}px`;
    bubble.style.transform = `translate(${base.current.x}px, ${base.current.y}px)`;
  }, [location.pathname]);

  // Hover snap behavior (THIS was missing)
  useEffect(() => {
    const nav = navRef.current;
    const bubble = bubbleRef.current;
    if (!nav || !bubble) return;

    const padX = 12;
    const padY = 6;

    const moveTo = (el) => {
      const rect = el.getBoundingClientRect();
      const parent = nav.getBoundingClientRect();

      bubble.style.width = `${rect.width + padX * 2}px`;
      bubble.style.height = `${rect.height + padY * 2}px`;
      bubble.style.transform = `translate(
        ${rect.left - parent.left - padX}px,
        ${rect.top - parent.top - padY}px
      )`;
    };

    const links = nav.querySelectorAll(".nav-link");

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => moveTo(link));
    });

    const reset = () => {
      bubble.style.width = `${base.current.w}px`;
      bubble.style.height = `${base.current.h}px`;
      bubble.style.transform = `translate(${base.current.x}px, ${base.current.y}px)`;
    };

    nav.addEventListener("mouseleave", reset);

    return () => {
      links.forEach((link) => {
        link.removeEventListener("mouseenter", () => moveTo(link));
      });
      nav.removeEventListener("mouseleave", reset);
    };
  }, [location.pathname]);

  return (
    <nav className="nav">
      <div className="nav-glass" ref={navRef}>
        <div className="nav-bubble" ref={bubbleRef} />

        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/about" className="nav-link">
          About
        </NavLink>
        <NavLink to="/contact" className="nav-link">
          Contact
        </NavLink>
      </div>
    </nav>
  );
}
