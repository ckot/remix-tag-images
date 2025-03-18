import type {ActionFunctionArgs} from "@remix-run/node"
import { redirect } from "@remix-run/node"

import invariant from "tiny-invariant"

import { dbController } from "~/data"

export const action = async({params, request} : ActionFunctionArgs) => {
    const formData = await request.formData();
    invariant(params.tagID, "tagID missing from params")
    const newName = String(formData.get("newName"))
    if (newName) {
        await dbController.renameTag(Number(params.tagID), newName);
    }
    return redirect(`/tags/${params.tagID}`)
}