import type { Tag } from "./data"


export interface Option {
  value: string;
  label: string;
}

export const tags2options = (tags: Tag[]) : Option[] => {
    return tags.map((t: Tag) => {
        return {value: t.id.toString(), label: t.name} as Option;
    })
}