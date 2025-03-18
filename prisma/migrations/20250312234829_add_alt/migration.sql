-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL
);
INSERT INTO "new_Image" ("height", "id", "src", "width") SELECT "height", "id", "src", "width" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_images_1" ON "Image"("src");
Pragma writable_schema=0;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
