import type {
  ActionFunctionArgs,
  LoaderFunctionArgs
} from "@remix-run/node"

import {
  redirect
} from "@remix-run/node"

import {
  useLoaderData,
  useRouteLoaderData,
} from "@remix-run/react"

import invariant from "tiny-invariant";

import {loader as rootLoader} from "../root"

import PaginatedResults from "~/components/PaginatedResults";
import ImageTagsForm from "~/components/ImageTagsForm";

import type {
  Tag,
  TaggedImage
} from "~/data";
import { dbController } from "~/data"



export const action = async({ request } : ActionFunctionArgs) => {
  const formData = await request.formData()
  invariant(formData.has("imageID"), "Formdata missing imageID")
  invariant(formData.has("tagIDs"), "Formdata missing tagIDs")
  const imageID = Number(formData.get("imageID"))
  const tagIDs = formData
    .getAll("tagIDs")
    .toString()
    .split(",")
    .map((i) => parseInt(i, 10));
  await dbController.updateImageTags(imageID, tagIDs)
  return redirect(request.url.toString())
}

export const loader = async({
    request
} : LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    const tagIDs = searchParams.getAll("tags")
    invariant(tagIDs, "Missing tagIDs in querystring")
    const page = searchParams.get("page")
    if (!page) {
        searchParams.set("page", "1")
        searchParams.set("pageSize", "25")
        return redirect(url.toString())
    }
    const pageSize = searchParams.get("pageSize") || "25"
    const result = await dbController.getPaginatedTaggedImagesWithTags({
        tagIDs: tagIDs.map(t => parseInt(t, 10)),
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
    })
    return Response.json({...result, url, tagIDs})
}

export default function Images() {
    const {data: taggedImages, page, pageSize, total, url, tagIDs} = useLoaderData<typeof loader>()
    const {tags: allTags} = useRouteLoaderData<typeof rootLoader>("root")
    const tagIdz = tagIDs.map((tid: number) => Number(tid))
    const tagNames = allTags.filter((t: Tag) => tagIdz.includes(t.id)).map((tg: Tag) => tg.name)
    const heading = tagIDs.length === 0
      ? "Untagged Images"
      : `Images with tags: ${tagNames.join(", ")}`

    return (
      <>
        <h1>{heading}</h1>
      {!taggedImages ? (
        <div>Loading...</div>
      ) : !taggedImages.length
        ? (
          <div>No matches</div>
        )
        : (
          <PaginatedResults
            url={url}
            page={page}
            pageSize={pageSize}
            total={total}
          >
            {taggedImages.map((taggedImage: TaggedImage, idx: number) => (
              <div key={taggedImage.id} className="cell">
                  <ImageTagsForm
                      taggedImage={taggedImage}
                      lazy={idx > 20}
                  />
              </div>
            ))}
            </PaginatedResults>
      )}
    </>
  )
}