import { Prisma, PrismaClient} from "@prisma/client";
import type {Image, Tag} from "@prisma/client"
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

import { z } from "zod";

// for consuming apps
export type { Image, Tag } from "@prisma/client";

// Define schemas
const schemas = {
  nonEmptyString: z.string().nonempty(),
  positiveInteger: z.number().int().positive(),
  nonEmptyArrayOfPositiveIntegers: z
    .array(z.number().int().positive())
    .nonempty(),
};

// do I need to export these???
export type NonEmptyString = z.infer<typeof schemas.nonEmptyString>;
export type PositiveInteger = z.infer<typeof schemas.positiveInteger>;
export type NonEmptyArrayOfPositiveIntegers = z.infer<
  typeof schemas.nonEmptyArrayOfPositiveIntegers
>;

// some constants so that I can keep the default values for pagination
// parameters in sync between the JSdoc and the implementation
const DEFAULT_PAGE_NUMBER: PositiveInteger = 1;
const DEFAULT_PAGE_SIZE: PositiveInteger = 25;

/**
 * Represents a paginated result set.
 *
 * @template T - The type of items in the result set
 *
 * @property {T[]} data - The array of items for the current page
 * @property {number} total - The total number of items across all pages
 * @property {PositiveInteger} page - The current page number (1-based)
 * @property {PositiveInteger} pageSize - The maximum number of items per page
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: PositiveInteger;
  pageSize: PositiveInteger;
}


interface PaginationParams {
  pageNum: PositiveInteger;
  numPerPage: PositiveInteger
}

interface PaginatedQueryParams {
  page?: number;
  pageSize?: number;
}

interface GetPaginatedTagsParams extends PaginatedQueryParams{
  whereClause?: Prisma.TagWhereInput;
  include?: Prisma.TagInclude;
  orderBy?: Prisma.TagOrderByWithRelationInput;
}

interface GetPaginatedImagesParams extends PaginatedQueryParams{
  whereClause?: Prisma.ImageWhereInput;
  include?: Prisma.ImageInclude;
  orderBy?: Prisma.ImageOrderByWithRelationInput;
}

/**
 * Helper function to validate pagination params
 *
 * @param {unknown} page - the requested page number
 * @param {unknown} pageSize - the maximum number of records per page
 * @returns {PaginationParams}
 * @throws {Error} if the parameters fail validation
 */
function validatePaginationParams(page: PositiveInteger, pageSize: PositiveInteger) : PaginationParams {
  const pageNum = schemas.positiveInteger.parse(page)
  const numPerPage = schemas.positiveInteger.parse(pageSize)
  return {pageNum, numPerPage}
}

// Helper function to handle Prisma errors
function handlePrismaError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        throw new Error(
          `Record not found: ${error.meta?.cause || "Unknown cause"}`
        );
      case "P2016":
        throw new Error(
          `Record does not exist: ${error.meta?.target || "Unknown target"}`
        );
      case "P2002":
        throw new Error(
          `Unique constraint violation: ${
            error.meta?.target || "Unknown field"
          }`
        );
      default:
        throw new Error(`Database error: ${error.message}`);
    }
  } else if (error instanceof PrismaClientValidationError) {
    throw new Error(`Validation error: ${error.message}`);
  } else {
    throw new Error(
      `Unexpected error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Database controller that abstracts away the underlying ORM and database implementation.
 * Provides methods for managing images and tags in the database.
 *
 * @class DBController
 */
class DBController {
  /**
   * Prisma client instance for database operations.
   */
  prisma: PrismaClient;

  /**
   * Creates a new DBController instance and initializes the Prisma client.
   */
  constructor() {
    this.prisma = new PrismaClient();
  }
  /**
   * Generic helper method for fetching paginated data with total count.
   * This method handles pagination, filtering, and counting in a single database transaction.
   *
   * @template T - The type of items being paginated
   * @template WhereInput - The type of the where clause
   * @template IncludeInput - The type of the include clause (optional)
   * @template OrderByInput - The type of the orderBy clause (optional)
   *
   * @param {Object} options - The pagination options
   * @param {Object} options.model - The Prisma model to query
   * @param {Function} options.model.findMany - The findMany function of the model
   * @param {Function} options.model.count - The count function of the model
   * @param {WhereInput} options.whereClause - The where clause to filter records
   * @param {number} [options.page=DEFAULT_PAGE_NUMBER] - The page number (1-based)
   * @param {number} [options.pageSize=DEFAULT_PAGE_SIZE] - The number of items per page
   * @param {IncludeInput} [options.include] - (optional) The relations to include
   * @param {OrderByInput} [options.orderBy] - (optional) The sorting criteria
   *
   * @returns {Promise<PaginatedResult<T>>} A promise that resolves to the paginated result
   * @throws {Error} If the database query fails
   *
   * @example see {@link getPaginatedTags()} and {@link getPaginatedImages()} for example usage of model-specific wrapper around this method
   *
   * @example
   * // Example usage with a mock object for testing
   * const mockModel = {
   *   findMany: jest.fn().mockResolvedValue([
   *     { id: 1, name: 'Test Item 1' },
   *     { id: 2, name: 'Test Item 2' }
   *   ]),
   *   count: jest.fn().mockResolvedValue(10)
   * };
   *
   * // Test the getPaginated method with the mock
   * const result = await dbController.getPaginated({
   *   model: mockModel,
   *   whereClause: { name: { contains: 'Test' } },
   *   page: 1,
   *   pageSize: 2
   * });
   *
   * // Assertions
   * expect(result.data).toHaveLength(2);
   * expect(result.total).toBe(10);
   * expect(result.page).toBe(1);
   * expect(result.pageSize).toBe(2);
   *
   * // Verify mock was called with correct parameters
   * expect(mockModel.findMany).toHaveBeenCalledWith({
   *   where: { name: { contains: 'Test' } },
   *   skip: 0,
   *   take: 2
   * });
   * expect(mockModel.count).toHaveBeenCalledWith({
   *   where: { name: { contains: 'Test' } }
   * });
   */
  private async getPaginated<
    T,
    WhereInput = Prisma.InputJsonValue,
    IncludeInput = Prisma.InputJsonValue,
    OrderByInput = Prisma.InputJsonValue
  >({
    model,
    whereClause,
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
    include,
    orderBy,
  }: {
    model: {
      findMany: (args: {
        where?: WhereInput;
        include?: IncludeInput;
        orderBy?: OrderByInput;
        skip?: number;
        take?: number;
      }) => Promise<T[]>;
      count: (args: { where?: WhereInput }) => Promise<number>;
    };
    whereClause: WhereInput;
    page?: number;
    pageSize?: number;
    include?: IncludeInput;
    orderBy?: OrderByInput;
  }): Promise<PaginatedResult<T>> {
    // runtime validation of pagination params
    const { pageNum, numPerPage } = validatePaginationParams(page, pageSize);

    try {
      const [data, total] = await this.prisma.$transaction(async (_tx) => {
        const data = await model.findMany({
          where: whereClause,
          ...(include ? { include } : {}),
          ...(orderBy ? { orderBy } : {}),
          skip: (pageNum - 1) * numPerPage,
          take: numPerPage,
        });

        const total = await model.count({
          where: whereClause,
        });

        return [data, total];
      });

      return {
        data,
        total,
        page: pageNum,
        pageSize: numPerPage,
      };
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Tag model-specific wrapper around getPaginated()
   *
   * @param {Object} options - uses named parameters
   * @param {Prisma.TagWhereInput} [options.whereClause={}] - the query's where clause
   * @param {Prisma.TagInclude} [options.include={images : false}] - (optional) - what associated objects to include in results
   * @param {Prisma.TagOrderByWithRelationInput} [options.orderBy={name: "asc"}] - (optional) results sort order
   * @param {number} [options.page=DEFAULT_PAGE_NUMBER] - The page number (1-based)
   * @param {number} [options.pageSize=DEFAULT_PAGE_SIZE] - the number of items per page
   *
   * @returns {Promise<PaginatedResult<Tag>>} a promise which resolves to a paginated array of Tags
   * @throws {Error} if the database query fails
   *
   * @example - see {@link getAllTags()} for example usage
   */
  private async getPaginatedTags({
    whereClause = {},
    include = { images: false },
    orderBy = { name: "asc" },
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
  }: GetPaginatedTagsParams = {}) {
    return await this.getPaginated<
      Tag,
      Prisma.TagWhereInput,
      Prisma.TagInclude,
      Prisma.TagOrderByWithRelationInput
    >({
      model: this.prisma.tag,
      whereClause,
      include,
      orderBy,
      page,
      pageSize,
    });
  }

  /**
   * Image model-specific wrapper around getPaginated()
   *
   * @param {Object} options
   * @param {Prisma.ImageWhereInput}  options.whereClause - the where clause
   * @param {Prisma.ImageInclude} [options.include={tags: false}] - (optional) include clause
   * @param {Prisma.ImageOrderByWithRelationInput} options.orderBy - (optional) orderBy clause
   * @param {number} [options.page=DEFAULT_PAGE_NUMBER] - The page number (1 - based)
   * @param {number} [options.pageSize=DEFAULT_PAGE_SIZE] - The number of items per page
   *
   * @returns {Promise<PaginatedResult<Tag>>} - a promise which resolves to a paginated array of images
   * @throws {Error} if the database query failse
   *
   * @example see {@link getUntaggedImages()} for example usage
   */
  private async getPaginatedImages({
    whereClause = {},
    include = { tags: true },
    orderBy = {},
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
  }: GetPaginatedImagesParams = {}): Promise<PaginatedResult<Image>> {
    return await this.getPaginated<
      Image,
      Prisma.ImageWhereInput,
      Prisma.ImageInclude,
      Prisma.ImageOrderByWithRelationInput
    >({
      model: this.prisma.image,
      whereClause,
      include,
      orderBy,
      page,
      pageSize,
    });
  }

  /**
   * Creates a new image in the database.
   *
   * @param {Prisma.ImageCreateInput} img - The image data to create
   * @returns {Promise<Image>} The created image
   * @throws {Error} If the image creation fails (e.g., validation error, unique constraint violation)
   */
  async createImage(img: Prisma.ImageCreateInput): Promise<Image> {
    try {
      return await this.prisma.image.create({ data: img });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Creates a new tag in the database.
   *
   * @param {Prisma.TagCreateInput} tag - The tag data to create
   * @returns {Promise<Tag>} The created tag
   * @throws {Error} If the tag creation fails (e.g., validation error, unique constraint violation)
   */
  async createTag(tag: Prisma.TagCreateInput): Promise<Tag> {
    try {
      return await this.prisma.tag.create({ data: tag });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Retrieves an image by its ID.
   *
   * @param {PositiveInteger} imageID - The ID of the image to retrieve
   * @param {boolean} [includeTags=true] - Whether to include related tags in the result
   * @returns {Promise<Image>} The retrieved image with its tags (if includeTags is true)
   * @throws {Error} If the image is not found or another database error occurs
   */
  async getImageByID(
    imageID: PositiveInteger,
    includeTags: boolean = true
  ): Promise<Image> {
    const validatedImageID = schemas.positiveInteger.parse(imageID);
    try {
      return await this.prisma.image.findUniqueOrThrow({
        where: {
          id: validatedImageID,
        },
        include: {
          tags: includeTags,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }
  /**
   * Retrieves all tags from the database, sorted alphabetically by name.
   *
   * @param {PositiveInteger} [page=DEFAULT_PAGE_NUMBER] - the page number of results to retrieve
   * @param {PositiveInteger} [pageSize=DEFAULT_PAGE_SIZE] - the maximum number of records per page
   * @returns {Promise<PaginatedResult<Tag>>} Paginated Array of all tags
   */
  async getAllTags({
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
  }): Promise<PaginatedResult<Tag>> {
    const whereClause: Prisma.TagWhereInput = {};
    const include: Prisma.TagInclude = { images: false };
    const orderBy: Prisma.TagOrderByWithRelationInput = { name: "asc" };
    return await this.getPaginatedTags({
      whereClause,
      include,
      orderBy,
      page,
      pageSize,
    });
  }

  async searchTags({
    substring = "", // default value will fail validation
    includeImages = false,
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE,
  }): Promise<PaginatedResult<Tag>> {
    // runtime validation of search term
    const validSearchTerm = schemas.nonEmptyString.parse(substring);
    const whereClause: Prisma.TagWhereInput = {
      name: {
        contains: validSearchTerm,
      },
    };
    const include: Prisma.TagInclude = {
      images: includeImages,
    };

    return await this.getPaginatedTags({
      whereClause,
      include,
      page,
      pageSize,
    });
  }

  /**
   * Retrieves a tag by its ID.
   *
   * @param {PositiveInteger} tagID - The ID of the tag to retrieve
   * @param {boolean} [includeImages=false] - Whether to include related images in the result
   * @returns {Promise<Tag>} The retrieved tag with its images (if includeImages is true)
   * @throws {Error} If the tag is not found or another database error occurs
   */
  async getTagByID(tagID = -1, includeImages = false): Promise<Tag> {
    const validatedTagID = schemas.positiveInteger.parse(tagID);
    try {
      return await this.prisma.tag.findUniqueOrThrow({
        where: {
          id: validatedTagID,
        },
        include: {
          images: includeImages,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Retrieves a tag by its name.
   *
   * @param {string} tagName - The name of the tag to retrieve
   * @param {boolean} [includeImages=false] - Whether to include related images in the result
   * @returns {Promise<Tag>} The retrieved tag with its images (if includeImages is true)
   * @throws {Error} If the tag is not found or another database error occurs
   */
  async getTagByName(
    tagName: string,
    includeImages: boolean = false
  ): Promise<Tag> {
    try {
      return await this.prisma.tag.findUniqueOrThrow({
        where: {
          name: tagName,
        },
        include: {
          images: includeImages,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Retrieves a paginated set of Images which don't have any tags
   *
   * @param {PositiveInteger} [page=DEFAULT_PAGE_NUMBER] - the page number of images to retrieve
   * @param {PositiveInteger} [pageSize=DEFAULT_PAGE_SIZE] - the maximum number of images per page
   * @returns {Promise<PaginatedResult<Image>>} A paginated Array of untagged images
   * @throws {Error} If a database error occurs
   */
  async getUntaggedImages(
    page = DEFAULT_PAGE_NUMBER,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult<Image>> {
    const whereClause: Prisma.ImageWhereInput = {
      tags: {
        none: {},
      },
    };
    const include: Prisma.ImageInclude = {
      tags: false,
    };
    return await this.getPaginatedImages({
      whereClause,
      include,
      page,
      pageSize,
    });
  }

  /**
   * Retrives a paginated set of Images which have ALL of the specified tags
   *
   * @param {NonEmptyArrayOfPositiveIntegers} tagIDs - the IDs for the tags being searched for
   * @param {PositiveInteger} [page=DEFAULT_PAGE_NUMBER] - the page number
   * @param {PositiveInteger} [pageSize=DEFAULT_PAGE_SIZE] - the max number of images per page
   * @returns
   */
  async getImagesWithTags(
    tagIDs: NonEmptyArrayOfPositiveIntegers,
    page = DEFAULT_PAGE_SIZE,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult<Image>> {
    // runtime validation of tagIDs array
    const validTags = schemas.nonEmptyArrayOfPositiveIntegers.parse(tagIDs);

    const whereClause: Prisma.ImageWhereInput = {
      AND: validTags.map((tagID) => ({
        tags: {
          some: {
            id: tagID,
          },
        },
      })),
    };
    return await this.getPaginatedImages({
      whereClause,
      page,
      pageSize,
    });
  }

  /**
   * Renames a tag.
   *
   * @param {PositiveInteger} tagID - The ID of the tag to rename
   * @param {string} newName - The new name for the tag
   * @returns {Promise<Tag>} The updated tag
   * @throws {Error} If the tag is not found, the new name conflicts with an existing tag, or another database error occurs
   */
  async renameTag(tagID: PositiveInteger, newName: string): Promise<Tag> {
    const validatedTagID = schemas.positiveInteger.parse(tagID);
    try {
      return await this.prisma.tag.update({
        where: {
          id: validatedTagID,
        },
        data: {
          name: newName,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Migrates images from one tag to another.
   * Finds all images with the fromTagID and replaces that tag with toTagID.
   *
   * @param {PositiveInteger} fromTagID - The ID of the source tag
   * @param {PositiveInteger} toTagID - The ID of the destination tag
   * @returns {Promise<Image[]>} Array of updated images
   * @throws {Error} If either tag is not found or another database error occurs
   */
  async migrateImageTag(
    fromTagID: PositiveInteger,
    toTagID: PositiveInteger
  ): Promise<Image[]> {
    const validatedOldTagID = schemas.positiveInteger.parse(fromTagID);
    const validatedNewTagID = schemas.positiveInteger.parse(toTagID);

    const imagesWithOldTag = await this.prisma.image.findMany({
      where: {
        tags: {
          some: {
            id: validatedOldTagID,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const imageIDs = imagesWithOldTag.map((img) => img.id);

    return await this.prisma.$transaction(
      imageIDs.map((imageID) =>
        this.prisma.image.update({
          where: { id: imageID },
          data: {
            tags: {
              disconnect: { id: validatedOldTagID },
              connect: { id: validatedNewTagID },
            },
          },
        })
      )
    );
  }

  /**
   * Updates the tags for a specific image.
   * Replaces all existing tags with the provided set of tags.
   *
   * @param {PositiveInteger} imageID - The ID of the image to update
   * @param {NonEmptyArrayOfPositiveIntegers} newTagIDs - Array of tag IDs to assign to the image
   * @returns {Promise<Image>} The updated image with its new tags
   * @throws {Error} If the image is not found, any tag is not found, or another database error occurs
   */
  async updateImageTags(
    imageID: PositiveInteger,
    newTagIDs: NonEmptyArrayOfPositiveIntegers
  ): Promise<Image> {
    const validImageID = schemas.positiveInteger.parse(imageID);
    const validTags = schemas.nonEmptyArrayOfPositiveIntegers.parse(newTagIDs);

    try {
      return await this.prisma.image.update({
        where: {
          id: validImageID,
        },
        data: {
          tags: {
            set: validTags.map((tagID) => ({ id: tagID })),
          },
        },
        include: {
          tags: true,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Deletes an image from the database.
   * This will also remove the image from all associated tags.
   *
   * @param {PositiveInteger} imageID - The ID of the image to delete
   * @returns {Promise<Image>} The deleted image
   * @throws {Error} If the image is not found or another database error occurs
   */
  async deleteImage(imageID: PositiveInteger): Promise<Image> {
    const validatedImageID = schemas.positiveInteger.parse(imageID);
    try {
      return await this.prisma.image.delete({
        where: {
          id: validatedImageID,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  /**
   * Deletes a tag from the database.
   * This will also remove the tag from all associated images.
   *
   * @param {PositiveInteger} tagID - The ID of the tag to delete
   * @returns {Promise<Tag>} The deleted tag
   * @throws {Error} If the tag is not found or another database error occurs
   */
  async deleteTag(tagID: PositiveInteger): Promise<Tag> {
    const validatedTagID = schemas.positiveInteger.parse(tagID);
    try {
      return await this.prisma.tag.delete({
        where: {
          id: validatedTagID,
        },
      });
    } catch (error: unknown) {
      return handlePrismaError(error) as never;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Singleton instance of the DBController.
 * Use this exported instance for all database operations.
 */
export const db = new DBController();
