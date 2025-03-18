import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import invariant from "tiny-invariant";

import { dbController } from "../data";

export const action = async ({ params }: ActionFunctionArgs) => {
  invariant(params.tagID, "Missing tagID param");
  await dbController.deleteTag(parseInt(params.tagID, 10));
  return redirect("/");
};
