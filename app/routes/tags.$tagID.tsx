import { Form, Link, useLoaderData, useRouteLoaderData } from "@remix-run/react";

import type { LoaderFunctionArgs } from "@remix-run/node";

import invariant from "tiny-invariant";
import {loader as rootLoader} from "../root"

import type { Tag } from "../data";
import { dbController } from "../data";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.tagID, "Missing tagID param");
  const tag = await dbController.getTagByID(parseInt(params.tagID, 10));
  if (!tag) {
    throw new Response("Tag not found", { status: 404 });
  }
  return Response.json(tag);
};

export default function Tag() {
  const tag = useLoaderData<typeof loader>();
  const {tags} = useRouteLoaderData<typeof rootLoader>("root")
  const otherTags = tags.filter((t: Tag) => t.id === tag.id)

  return (
    <article>
      <div className="content">
        <h1>Tag: {tag.name}</h1>

        <h3>Available actions on this tag:</h3>
      </div>

      <section className="box">
        <Form action="rename" method="post">
          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label htmlFor="newName" className="label">
                New Name
              </label>
            </div>
            <div className="field-body">
              <div className="control">
                <input
                  name="newName"
                  type="text"
                  className="input"
                  placeholder="New name for this tag"
                />
              </div>
              <div className="control">
                <button className="button is-primary" type="submit">
                  Change name
                </button>
              </div>
            </div>
          </div>
        </Form>
      </section>

      <section className="box">
        <Form
          action="destroy"
          method="post"
          onSubmit={(event) => {
            const response = confirm(
              "Please confirm you want to delete this tag."
            );
            if (!response) {
              event.preventDefault();
            }
          }}
        >
          <div className="field">
            <div className="control">
              <button
                type="submit"
                name="delete"
                className="button is-danger"
              >
                Delete this tag
              </button>
            </div>
          </div>
        </Form>
      </section>

      <section className="box">
        <Link
          className="button is-primary"
          to={{
            pathname: "/images",
            search: `?tagIDs=${tag.id}`,
          }}
        >
          List images with this tag
        </Link>
      </section>

      <section className="box">
        <Form action="retag" method="post">
          <div className="field is-horizontal">
            <div className="field-label">
              <label htmlFor="withTagID" className="label">
                Replace all usages of this tag with :
              </label>
            </div>
            <div className="field-body">
              <div className="control">
                <div className="select">
                  <select name="withTagID" defaultValue={""} className="select" required>
                    <option value="">- Select another tag -</option>
                    {otherTags.map((t: Tag) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="control">
                <button type="submit" className="button is-warning">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Form>
      </section>
    </article>
  );
}
