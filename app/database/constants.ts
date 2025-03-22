import { Prisma } from "@prisma/client";
import type { PositiveInteger } from "./types";

// some constants representing default method parameters
// and default database query bits
// additionally, these can be embedded in JSDoc to keep doc/code in sync
export const DEFAULT_PAGE_NUMBER: PositiveInteger = 1;
export const DEFAULT_PAGE_SIZE: PositiveInteger = 25;
export const DEFAULT_IMAGE_SAMPLE_SIZE = 5;
export const DEFAULT_TAG_INCLUDES: Prisma.TagInclude = {
  images: false,
};
export const DEFAULT_TAG_ORDER_BY: Prisma.TagOrderByWithRelationInput = {
  name: "asc",
};
export const DEFAULT_IMAGE_INCLUDES: Prisma.ImageInclude = {
  tags: true,
};
export const DEFAULT_IMAGE_ORDER_BY: Prisma.ImageOrderByWithRelationInput = {};
