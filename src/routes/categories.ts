import express from "express";
import { parseId } from "../lib/parseId.js";
import {
  CategoryInUseError,
  createCategory,
  deleteCategory,
  DuplicateCategoryError,
  getCategory,
  listCategories,
  replaceCategory,
} from "../services/categoryService.js";
import { categorySchema } from "../schemas/category.js";
import type z from "zod";

export const categoriesRouter = express.Router();

function sendValidationError(res: express.Response, error: z.ZodError) {
  res
    .status(400)
    .json({ error: "Invalid category data", details: error.issues });
}

categoriesRouter.get("/", async (_req, res) => {
  res.json(await listCategories());
});

categoriesRouter.get("/:id", async (req, res) => {
  const categoryId = parseId(req.params.id);
  if (categoryId === undefined) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const category = await getCategory(categoryId);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

categoriesRouter.post("/", async (req, res) => {
  const parseResult = categorySchema.safeParse(req.body);

  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
    return;
  }

  try {
    const category = await createCategory(parseResult.data);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof DuplicateCategoryError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

categoriesRouter.put("/:id", async (req, res) => {
  const categoryId = parseId(req.params.id);
  if (categoryId === undefined) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const parseResult = categorySchema.safeParse(req.body);
  if (!parseResult.success) {
    sendValidationError(res, parseResult.error);
    return;
  }

  try {
    const category = await replaceCategory(categoryId, parseResult.data);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    if (error instanceof DuplicateCategoryError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

categoriesRouter.delete("/:id", async (req, res) => {
  const categoryId = parseId(req.params.id);
  if (categoryId === undefined) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }
  try {
    if (!(await deleteCategory(categoryId))) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});
