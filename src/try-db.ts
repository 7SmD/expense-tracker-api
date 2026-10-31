import { prisma } from "./lib/prisma.js";

const categories = await prisma.category.findMany();
console.log(categories);
await prisma.$disconnect();