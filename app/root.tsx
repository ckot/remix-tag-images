import React from "react";
import type { LinksFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";

import appStylesHref from "./app.css?url";

import { dbController } from "./data";

import Navbar from "./components/Navbar";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref, as: "style" },
];

export const loader = async () => {
  const tags = await dbController.getTags();
  return Response.json({ tags });
};

export const action = async () => {
  const tag = await dbController.createTag("");
  return redirect(`/tags/${tag.id}`);
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="has-navbar-fixed-top">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function App() {
  const { tags } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar tags={tags} />
      <main id="detail">
        <Outlet />
      </main>
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <>
      <Navbar tags={[]} />
      <main id="detail">
        <pre>{typeof error}</pre>
      </main>
    </>
  );
}
