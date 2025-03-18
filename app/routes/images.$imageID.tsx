// // import { json } from "@remix-run/node";
// import type { LoaderFunctionArgs } from "@remix-run/node"

// import invariant from "tiny-invariant"

// import { dbController } from "~/data";

// export const loader = async ({
//     params,
// } : LoaderFunctionArgs) => {
//     invariant(params.imageID, "Missing imageID param");
//     const tags = await dbController.getTagsForImage(
//         Number(params.imageID)
//     );
//     return Response.json({tags})
// }