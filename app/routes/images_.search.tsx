import { Form, useRouteLoaderData, useSubmit } from "@remix-run/react";

import MultiSelect from "~/components/MultiSelect";

import { loader as rootLoader} from "../root"

import { tags2options } from "~/utils";

export default function ImageSearch() {
    const submit = useSubmit()
    const {tags: allTags} = useRouteLoaderData<typeof rootLoader>("root")
    const allOptions = tags2options(allTags)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        const form = event.target as HTMLFormElement
        const formData = new FormData(form)
        submit(formData,
            {method: "GET", action:"/images"}
        )
    }

    return (
        <>
            <h1>Search for images with 0 or more tags</h1>
            <Form
                action="/images"
                method="get"
                onSubmit={handleSubmit}
            >
                <MultiSelect
                    fieldName="tags"
                    initialOptions={[]}
                    allOptions={allOptions}
                />
                <button type="submit">Search</button>
            </Form>
        </>
    )

}