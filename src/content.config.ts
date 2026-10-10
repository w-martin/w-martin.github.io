import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    // Drafts show in `npm run dev` for reviewing, and are left out of every build (including the deploy).
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
