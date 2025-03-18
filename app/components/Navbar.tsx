import { Form, NavLink } from "@remix-run/react";

import type { Tag } from "~/data";

interface NavbarProps {
  tags: Tag[];
}

export default function Navbar(props: NavbarProps) {
  const { tags } = props;

  return (
    <nav
      className="navbar is-fixed-top"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand">
        <NavLink className="navbar-item" to="/">
          Tagin
        </NavLink>
        <button
          type="button"
          className="navbar-burger"
          aria-label="menu"
          aria-expanded={false}
          data-target="tagin-navbar"
        >
          <span aria-hidden={true}></span>
          <span aria-hidden={true}></span>
          <span aria-hidden={true}></span>
          <span aria-hidden={true}></span>
        </button>
      </div>
      <div id="tagin-navbar">
        <div className="navbar-start">
          <div className="navbar-item">
            <Form method="post" action="/tags/create">
              <button type="submit">Create new Tag</button>
            </Form>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <button type="button" className="navbar-link">
              View Tag
            </button>
            <div className="navbar-dropdown">
              {tags.map((t: Tag) => (
                <a key={t.id} className="navbar-item" href={`/tags/${t.id}`}>
                  {t.name}
                </a>
              ))}
            </div>
          </div>
          <div className="navbar-item">
            <NavLink to="/images/search">Search Images</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
