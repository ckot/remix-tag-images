import {
  PrismaClient,
  Prisma
} from "@prisma/client";

const prisma = new PrismaClient();

async function seedImages() {
  const imageData: Prisma.ImageCreateInput[] = []
  for (let i = 0; i < 3; i++) {
    const res = await fetch(
      "https://api.thecatapi.com/v1/images/search?limit=10"
    );
    for (const img of await res.json()) {
      const {url: src, width, height} = img;
      imageData.push({src, width, height})
    }
  }
  for (const image of imageData) {
    await prisma.image.create({data: image})
  }
}

async function seedTags() {
  const tagData: Prisma.TagCreateInput[] = [
    {
      name: "cute"
    },
    {
      name: "fat"
    },
    {
      name: "grumpy"
    }
  ]
  for (const tag of tagData) {
    await prisma.tag.create({data: tag})
  }
}

export async function main() {
  await seedImages();
  await seedTags();
}

main();
