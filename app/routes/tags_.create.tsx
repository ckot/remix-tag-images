// import type {
//     ActionFunctionArgs,
//     LoaderFunctionArgs
// } from "@remix-run/node"

import { redirect } from "@remix-run/node"

import { dbController } from "~/data"

// export const loader = async () => {
//     const newTag = await dbController.createTag("")
//     return redirect(`/tags/${newTag.id}/edit`)
// }

export const action = async () => {
    const newTag = await dbController.createTag("");
    return redirect(`/tags/${newTag.id}/edit`);
}