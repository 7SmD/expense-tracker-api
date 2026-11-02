import type { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { isPrismaError } from "../lib/prismaError.js";

import type { categorySchema } from "../schemas/category.js";

export type CategoryData = z.infer<typeof categorySchema>;

export class DuplicateCategoryError extends Error {
  constructor() {
    super("Category with this name already exists");
  }
}

export class CategoryInUseError extends Error {
  constructor() {
    super("Category is in use");
  }
}

export async function listCategories() {
  return prisma.category.findMany();
}

export async function getCategory(id: number) {
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(data: CategoryData) {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } },
  });
  if (existing) {
    throw new DuplicateCategoryError();
  }

  try {
    return await prisma.category.create({ data: { name: data.name } });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new DuplicateCategoryError();
    }
    throw error;
  }
}

export async function replaceCategory(id: number, data: CategoryData) {
  const duplicate = await prisma.category.findFirst({
    where: {
      name: { equals: data.name, mode: "insensitive" },
      id: { not: id },
    },
  });
  if (duplicate) {
    throw new DuplicateCategoryError();
  }

  try {
    return await prisma.category.update({
      where: { id },
      data: { name: data.name },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return null;
    }
    if (isPrismaError(error, "P2002")) {
      throw new DuplicateCategoryError();
    }
    throw error;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return false;
    }
    if (isPrismaError(error, "P2003")) {
      throw new CategoryInUseError();
    }
    throw error;
  }
}
