import sqlite3 from "sqlite3"
import {
    open,
    Database
} from "sqlite"
sqlite3.verbose()

export type Image = {
    id: number;
    src: string;
    width: number;
    height: number;
};

export type PartialImage = Omit<Image, "id">


export type Tag = {
    id: number;
    name: string;
};

export interface TaggedImage extends Image {
    tags: Tag[]
}

// interface ImageTag  {
//     imageID: number;
//     tagID: number;
// }

export type PartialTag = Omit<Tag, "id">;

interface PaginatedQuery {
    page?: number;
    pageSize?: number;
}

// export interface ImageTagPaginatedQuery extends PaginatedQuery {
//     tagID?: number;
// }

export interface ImageTagsPaginatedQuery extends PaginatedQuery {
    tagIDs: number[];
}


interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}


export type PaginatedImageResult = PaginatedResult<Image> & {
    data: Image[]
}


export type PaginatedTaggedImagesResult = PaginatedResult<TaggedImage> & {
    data: TaggedImage[]
}

/**
 * Given an array of Images, pageNum, and pageSize, returns one page of
 * Image results.  this does a simple Array.slice() on the entire results
 * rather than having to specify OFFSET and LIMIT in each db query.
 * FIXME: this is a hack...
 *
 * @param arr
 * @param pageNum
 * @param pageSize
 * @returns the subset of Images in the orignal array as specified by pageNum
 * and pageSize
 */
function getPage(arr: Image[], pageNum: number, pageSize: number) : Image[] {
    const start = (pageNum -1) * pageSize;
    const end = start + pageSize;
    return arr.slice(start, end)
}

/**
 * a class encapsulating the db handle which provides methods for
 * manipulating the data
 */
class DBController {
  constructor(private db: Database) {}

  /**
   * Inserts an images data into the db
   * @param pi - a PartialImage (Image lacking the id property)
   * @returns a promise to the created Image (contains the assigned id)
   */
  async createImage(pi: PartialImage): Promise<Image> {
    const res = await this.db.run(
      `
            INSERT INTO images (src, width, height)
            VALUES(?, ?, ?)
        `,
      [pi.src, pi.width, pi.height]
    );
    if (res.lastID) {
      const createdImg = await this.getImageByID(res.lastID);
      return createdImg!; // we use '!' as we know it's not undefined
    } else {
      throw new Error("Image insertion failed");
    }
  }

  /**
   * Fetches an image by it's id (if it exists)
   *
   * @param imgID - the id of the image being looked up
   * @returns a promise to the matched image or undefined if not found
   */
  async getImageByID(imgID: number): Promise<Image | undefined> {
    const sql = "SELECT id, src, width, height FROM images where id = ?";
    const row = await this.db.get(sql, imgID);
    return row as Image | undefined;
  }

  /**
   * Creates a new tag with the specified name, doing nothing if a tag with
   * that name already exists
   * @param name - the name for the new tag
   * @returns a promise to either the created tag, or if it already existed,
   * the pre-existig tag
   */
  async createTag(name: string): Promise<Tag> {
    const sql = `
            INSERT INTO tags(name)
            VALUES(?)
            ON CONFLICT("name") DO NOTHING
        `;
    await this.db.run(sql, [name]);
    const res = await this.getTagByName(name);
    if (!res) {
      throw new Error("Tag creation failed");
    }
    return res;
  }

  /**
   * Fetches tags (either all, or matching the query), sorted by name
   *
   * @param query - optional string to perform a substring match of tag names
   * @returns - a promise to a sorted (by name) array of matching Tags (maybe
   * be empty)
   */
  async getTags(query?: string | null): Promise<Tag[]> {
    let sql = `
            SELECT id, name
            FROM tags
            `;
    if (query) {
      sql += `WHERE name LIKE '%${query}%'
            `;
    }
    sql += "ORDER BY name ASC";
    const rows = await this.db.all<Tag[]>(sql);
    return rows;
  }

  /**
   * Peforms a lookup of a tag by it's ID
   * @param tagID - the tag ID being looked up
   * @returns a promise to the Tag (if found) or undefined (if not)
   */
  async getTagByID(tagID: number): Promise<Tag | undefined> {
    const sql = "SELECT id, name FROM tags WHERE id = ?";
    const row = await this.db.get(sql, [tagID]);
    return row as Tag | undefined;
  }

  /**
   * Performs a tag lookup by it's name (label)
   * @param name - the tag name we're searching for
   * @returns a promise to either the tag (if found) or undefined (if not)
   */
  async getTagByName(name: string): Promise<Tag | undefined> {
    const sql = "SELECT id, name FROM tags WHERE name = ?";
    const row = await this.db.get(sql, [name]);
    return row as Tag | undefined;
  }

  /**
   * Changes the name (label) associated with a tagID
   *
   * @param tagID - the id for the tag the user wishes to alter
   * @param newName - the new name (label) for this tag
   * @returns a promise for the modified Tag
   */
  async renameTag(tagID: number, newName: string): Promise<Tag> {
    const sql = "UPDATE tags SET name = ? WHERE id = ?";
    const res = await this.db.run(sql, [newName, tagID]);
    if (res.changes !== undefined && res.changes > 0) {
      const tag = await this.getTagByID(tagID);
      return tag!;
    } else {
      throw new Error("Tag not found or update failed");
    }
  }

  /**
   * Retags all images which are currently associated with replaceTagID so that
   * they are instead tagged with withTagID
   *
   * @param replaceTagID - the tag we wish to dissasociate from all images
   * @param withTagID - the tag we wish to replace the associations with
   * @returns a promise to a boolean, with true signifing that changes occured
   */
  async replaceTag(replaceTagID: number, withTagID: number): Promise<boolean> {
    const sql = "UPDATE image_tags SET tag_id = ? where tag_id = ?";
    const res = await this.db.run(sql, [withTagID, replaceTagID]);
    return res?.changes ? res.changes > 0 : false;
  }

  /**
   * Deletes a tag specified by it's id.  The deletion will cascade,
   * disassocating any images previously associted with this tag
   *
   * @param tagID
   * @returns a promise for a boolean refering to whether any changes were
   *  made
   */
  async deleteTag(tagID: number): Promise<boolean> {
    const sql = "DELETE FROM tags WHERE id = ?";
    const res = await this.db.run(sql, [tagID]);
    return res?.changes ? res.changes > 0 : false;
  }

  /**
   * Similar to replaceTag() but also deletes the original tag after the swap
   * @param tagID2Delete - the tag to be replace by tagID2Keep, and then deleted
   * @param tagID2Keep - the tag to swap for all occurances of tagID2Delete
   */
  async mergeTags(tagID2Delete: number, tagID2Keep: number): Promise<void> {
    await this.replaceTag(tagID2Delete, tagID2Keep);
    await this.deleteTag(tagID2Delete);
  }

  /**
   * Fetches the array of Tags associated with an image
   * @param imgID
   * @returns a promise for a Tag[]
   */
  async getTagsForImage(imgID: number): Promise<Tag[]> {
    const sql = `
            SELECT id, name
            FROM tags
            WHERE id IN (
                SELECT tag_id
                FROM image_tags
                WHERE image_id = ?
            )
            ORDER BY name ASC
        `;
    const rows = await this.db.all<Tag[]>(sql, [imgID]);
    return rows;
  }

  /**
   *  Updates the tags associated with an image by comparing the before tags
   *  and the new tags using set theory to determine which tags to add and
   *  which to delete
   *
   * @param imgID
   * @param newTagIds
   * @returns a promise for the new Tag[]
   */
  async updateImageTags(imgID: number, newTagIds: number[]): Promise<Tag[]> {
    const before = new Set(
      (await this.getTagsForImage(imgID)).map((tag) => tag.id)
    );
    const after = new Set(newTagIds);
    const keep = before.intersection(after);
    const toDel = Array.from(before.difference(keep));
    const toIns = Array.from(after.difference(keep));
    if (toDel.length) {
      const delSql = `
                DELETE FROM image_tags
                WHERE image_id = ${imgID} AND
                      tag_id IN (${toDel.join(",")})
            `;
      const res = await this.db.run(delSql);
      if (!res.changes) {
        throw new Error("Dissasociation of tags for image failed");
      }
    }
    if (toIns.length) {
      const newValues = toIns.map((tagID) => `(${imgID}, ${tagID})`);
      const insSql = `
                INSERT INTO image_tags(image_id, tag_id) VALUES
                ${newValues.join(", ")}
            `;
      const res = await this.db.run(insSql);
      if (!res.changes) {
        throw new Error("Adding new tags to image failed");
      }
    }

    return await this.getTagsForImage(imgID);
  }

  //   async getPaginatedImagesWithTag(
  //     query: ImageTagPaginatedQuery
  //   ): Promise<PaginatedImageResult> {
  //     const { tagID = null, page = 1, pageSize = 25 } = query;
  //     if (!tagID) {
  //       return await this.getPaginatedUntaggedImages({ page, pageSize });
  //     }

  //     const matches = await this.db.all<Image[]>(
  //       `
  //             SELECT i.id, i.src, i.width, i.height
  //             FROM images as i, image_tags as it
  //             WHERE i.id = it.image_id AND
  //                   it.tag_id = ?
  //             ORDER BY i.id ASC
  //         `,
  //       [tagID]
  //     );

  //     return {
  //       total: matches.length,
  //       page,
  //       pageSize,
  //       data: getPage(matches, page, pageSize),
  //     } as PaginatedImageResult;
  //   }

  async getPaginatedUntaggedTaggedImages(
    query: PaginatedQuery
  ): Promise<PaginatedTaggedImagesResult> {
    const { page = 1, pageSize = 25 } = query;

    const matches = await this.db.all<Image[]>(`
            SELECT id, src, width, height
            FROM images
            WHERE id NOT in (SELECT DISTINCT image_id FROM image_tags)
            ORDER BY id ASC
        `);
    const taggedMatches: TaggedImage[] = []
    for (const mat of matches) {
        const ti = {...mat, tags: []} as TaggedImage
        taggedMatches.push(ti)
    }
    return {
      total: taggedMatches.length,
      page,
      pageSize,
      data: getPage(taggedMatches, page, pageSize),
    } as PaginatedTaggedImagesResult;
  }

  async getPaginatedImagesWithTags(
    query: ImageTagsPaginatedQuery
  ): Promise<PaginatedImageResult> {
    const { tagIDs, page = 1, pageSize = 25 } = query;
    // if (!tagIDs.length) {
    //   return await this.getPaginatedUntaggedImages({ page, pageSize });
    // }
    const sql = `
        SELECT id, src, width, height
        FROM images
        WHERE id IN (
            SELECT distinct(image_id)
            FROM image_tags
            WHERE tag_id in (${tagIDs.join(", ")})
            GROUP BY image_ID
            HAVING COUNT(tag_id) = ${tagIDs.length}
        )
        ORDER BY id ASC
    `;
    const matches = await this.db.all<Image[]>(sql);

    return {
      total: matches.length,
      page,
      pageSize,
      data: getPage(matches, page, pageSize),
    } as PaginatedImageResult;
  }

  /**
   * Fetches images which which have the tags specified in the query and for
   * each matche, returns all other tags associated with that image
   *
   * @param query - an ImageTagsPaginatedQuery, the pageNum, pageSize, and tags
   * being searched for
   *
   * @returns 1 page worth of TaggedImage[] which match they query
   */
  async getPaginatedTaggedImagesWithTags(
    query: ImageTagsPaginatedQuery
  ): Promise<PaginatedTaggedImagesResult> {
    const {tagIDs } = query;
    if (!tagIDs.length) {
        return await this.getPaginatedUntaggedTaggedImages(query)
    }
    // first gets a paginatedImageResult and then gets all tags associated
    // with the matched images to return a paginatedTaggedImagesResult
    const paginatedImageResult = await this.getPaginatedImagesWithTags(query);
    const imageIDs = paginatedImageResult.data.map((i) => i.id);
    // console.log(imageIDs)
    const sql = `
        SELECT i.image_id, t.id, t.name
        FROM image_tags as i,
            tags as t
        WHERE image_id in (${imageIDs.join(", ")})
            and i.tag_id = t.id
        ORDER BY i.image_id ASC,
                t.name ASC
    `;
    const imgTags = await this.db.all(sql);
    // console.log(imgTags)
    const img2Tags = new Map<number, Tag[]>();
    for (const it of imgTags) {
      // why is typescript forcing me to do this multi-line???
      const currTags = img2Tags.get(it.image_id) || [];
    //   console.log(`currTags for ${it.image_id}`, currTags)
      const tag = {id: it.id, name: it.name} as Tag
      currTags.push(tag);
      img2Tags.set(it.image_id, currTags);
    }
    // console.log(img2Tags)
    const result = {
      total: paginatedImageResult.total,
      page: paginatedImageResult.page,
      pageSize: paginatedImageResult.pageSize,
      data: [] as TaggedImage[],
    };
    for (const img of paginatedImageResult.data) {
      const taggedImage = { ...img, tags: img2Tags.get(img.id) || [] };
      result.data.push(taggedImage);
    }
    return result;
  }
}

export const DB_PATH = '/home/ckot/projects/remix-tag-images/images.db';

// export async function openDB(fileName) {
const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
});
await db.exec("PRAGMA journal_mode=WAL")
await db.exec("PRAGMA case_sensitive_like=OFF")

export const dbController = new DBController(db);

export const loadImages = async (dc: DBController) => {
  for (let i = 0; i < 3; i++) {
    console.log(`herding cat herd: ${i+1}`)
    const res = await fetch(
      "https://api.thecatapi.com/v1/images/search?limit=10"
    );
    for (const img of await res.json()) {
      await dc.createImage({
        src: img.url,
        width: img.width,
        height: img.height,
      });
    }
    console.log('waiting for next herd')
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
