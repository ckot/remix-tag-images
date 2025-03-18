import React, {
  // ChangeEventHandler,
  MouseEventHandler,
  // useEffect,
  // useRef,
  useState,
} from "react";

import { useFetcher, useRouteLoaderData } from "@remix-run/react";

// import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";

// import classNames from "classnames";
// import invariant from "tiny-invariant";

import ScaledImage from "./ScaledImage";

import { loader as rootLoader } from "../root";

import type { TaggedImage } from "~/data";
// import { dbController } from "~/data"

import MultiSelect from "./MultiSelect";
import ModalCard from "./ModalCard";
// import type { Option } from "~/utils";
import { tags2options } from "~/utils";

interface ImageTagsFormProps {
  taggedImage: TaggedImage;
  lazy?: boolean;
}

// function sortTags(tags: Tag[]) : Tag[] {
//     return tags.sort((a, b) => a.name.localeCompare(b.name))
// }

// export const loader: LoaderFunction = async ({
//   params,
// }: LoaderFunctionArgs) => {
//   invariant(params.imageID, "Missing imageID param");
//   const resp = await fetch(`/images/${params.imageID}`);
//   const data = await resp.json();
//   return Response.json(data);
// };

export default function ImageTagsForm({
  taggedImage,
  lazy = false,
}: ImageTagsFormProps) {
  const { tags: allTags } = useRouteLoaderData<typeof rootLoader>("root");
  const allOptions = tags2options(allTags);
  // const [initialOptions, setInitialOptions] = useState([] as Option[])
  const imgOptions = tags2options(taggedImage.tags);
  // const fetcher = useFetcher<typeof loader>();
  const fetcher = useFetcher();
  const [active, setActive] = useState(false);
  const [optionsChanged, setOptionsChanged] = useState(false);

  const showModal: MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    setActive(true);
  };

  const hideModal: MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    setActive(false);
  };


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    // rename tags to tagIDs
    const tagz = formData.getAll("tagIDs");
    tagz.forEach((t) => formData.append("tagIDs", t));
    formData.set("imageID", String(taggedImage.id));
    fetcher.submit(formData, { method: "post" });
  };

  // useEffect(() => {
  //   if (fetcher.state === "idle" && fetcher.data == null) {
  //     fetcher.load(`/images/${image.id}`);
  //   }
  // }, [fetcher, image]);

  // useEffect(() => {
  //   if (fetcher.data != null) {
  //     const tagz = fetcher.data.tags as Tag[];
  //     console.log("tagz", tagz);
  //     const optz = tags2options(tagz);
  //     console.log("optz", optz);
  //     // setInitialOptions(optz)
  //     setImgOptions(optz);
  //   }
  // }, [fetcher.data]);


  return (
    <div className="box">
      <fetcher.Form
        method="post"
        onSubmit={handleSubmit}
      >
        <div className="columns">
          <div className="column is-4">
            <ModalCard isOpen={active} close={hideModal}>
              <img
                src={taggedImage.src}
                alt=""
                width={taggedImage.width}
                height={taggedImage.height}
              />
            </ModalCard>
            <button type="button" onClick={showModal}>
              <ScaledImage
                src={taggedImage.src}
                alt=""
                width={taggedImage.width}
                height={taggedImage.height}
                desiredWidth={256}
                lazy={lazy}
              />
            </button>
          </div>
          <div className="column is-6">
            <input type="hidden" name="imageID" value={taggedImage.id} />
            <MultiSelect
              fieldName="tagIDs"
              initialOptions={imgOptions}
              allOptions={allOptions}
              setValuesDifferent={setOptionsChanged}
            />
          </div>
          <div className="column is-2">
            <button
              type="submit"
              className="button is-small is-primary"
              disabled={!optionsChanged}
            >
              Submit
            </button>
          </div>
        </div>
      </fetcher.Form>
    </div>
  );
}
