/*
  Warnings:

  - You are about to drop the column `brand` on the `Sneaker` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Size` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "ctaText" TEXT DEFAULT 'Shop Now',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Banner" ("active", "createdAt", "ctaText", "description", "id", "imageUrl", "link", "order", "subtitle", "title", "updatedAt") SELECT "active", "createdAt", "ctaText", "description", "id", "imageUrl", "link", "order", "subtitle", "title", "updatedAt" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
CREATE INDEX "Banner_active_idx" ON "Banner"("active");
CREATE INDEX "Banner_order_idx" ON "Banner"("order");
CREATE TABLE "new_Brand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Brand" ("createdAt", "description", "featured", "id", "imageUrl", "name", "order", "slug", "updatedAt") SELECT "createdAt", "description", "featured", "id", "imageUrl", "name", "order", "slug", "updatedAt" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");
CREATE INDEX "Brand_featured_idx" ON "Brand"("featured");
CREATE INDEX "Brand_order_idx" ON "Brand"("order");
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Category" ("createdAt", "description", "featured", "icon", "id", "name", "order", "slug", "updatedAt") SELECT "createdAt", "description", "featured", "icon", "id", "name", "order", "slug", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
CREATE INDEX "Category_featured_idx" ON "Category"("featured");
CREATE INDEX "Category_order_idx" ON "Category"("order");
CREATE TABLE "new_MegaMenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MegaMenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MegaMenuItem" ("categoryId", "createdAt", "icon", "id", "link", "order", "title") SELECT "categoryId", "createdAt", "icon", "id", "link", "order", "title" FROM "MegaMenuItem";
DROP TABLE "MegaMenuItem";
ALTER TABLE "new_MegaMenuItem" RENAME TO "MegaMenuItem";
CREATE INDEX "MegaMenuItem_categoryId_idx" ON "MegaMenuItem"("categoryId");
CREATE INDEX "MegaMenuItem_order_idx" ON "MegaMenuItem"("order");
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "sneakerId" INTEGER NOT NULL,
    "sneakerName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("color", "id", "orderId", "price", "quantity", "size", "sneakerId", "sneakerName") SELECT "color", "id", "orderId", "price", "quantity", "size", "sneakerId", "sneakerName" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE TABLE "new_Sneaker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brandId" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "colors" TEXT NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sneaker_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sneaker" ("brandId", "categories", "colors", "createdAt", "description", "featured", "id", "inStock", "modelName", "price", "slug") SELECT "brandId", "categories", "colors", "createdAt", "description", "featured", "id", "inStock", "modelName", "price", "slug" FROM "Sneaker";
DROP TABLE "Sneaker";
ALTER TABLE "new_Sneaker" RENAME TO "Sneaker";
CREATE UNIQUE INDEX "Sneaker_slug_key" ON "Sneaker"("slug");
CREATE INDEX "Sneaker_slug_idx" ON "Sneaker"("slug");
CREATE INDEX "Sneaker_brandId_idx" ON "Sneaker"("brandId");
CREATE INDEX "Sneaker_featured_idx" ON "Sneaker"("featured");
CREATE INDEX "Sneaker_inStock_idx" ON "Sneaker"("inStock");
CREATE INDEX "Sneaker_createdAt_idx" ON "Sneaker"("createdAt");
CREATE TABLE "new_SneakerImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "s3Key" TEXT,
    "checksum" TEXT,
    "scanStatus" TEXT DEFAULT 'pending',
    "order_index" INTEGER,
    "sneakerId" INTEGER NOT NULL,
    CONSTRAINT "SneakerImage_sneakerId_fkey" FOREIGN KEY ("sneakerId") REFERENCES "Sneaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SneakerImage" ("checksum", "filename", "id", "order_index", "s3Key", "scanStatus", "sneakerId", "url") SELECT "checksum", "filename", "id", "order_index", "s3Key", "scanStatus", "sneakerId", "url" FROM "SneakerImage";
DROP TABLE "SneakerImage";
ALTER TABLE "new_SneakerImage" RENAME TO "SneakerImage";
CREATE INDEX "SneakerImage_sneakerId_idx" ON "SneakerImage"("sneakerId");
CREATE INDEX "SneakerImage_scanStatus_idx" ON "SneakerImage"("scanStatus");
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sneakerId" INTEGER NOT NULL,
    "sizeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "Stock_sneakerId_fkey" FOREIGN KEY ("sneakerId") REFERENCES "Sneaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Stock_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("id", "quantity", "sizeId", "sneakerId") SELECT "id", "quantity", "sizeId", "sneakerId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE INDEX "Stock_sneakerId_idx" ON "Stock"("sneakerId");
CREATE INDEX "Stock_sizeId_idx" ON "Stock"("sizeId");
CREATE UNIQUE INDEX "Stock_sneakerId_sizeId_key" ON "Stock"("sneakerId", "sizeId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isAdmin", "name", "password") SELECT "createdAt", "email", "id", "isAdmin", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Size_name_key" ON "Size"("name");
