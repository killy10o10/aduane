import { PrismaClient } from "@prisma/client";
import { DISHES } from "../src/data/dishes";

const prisma = new PrismaClient();

// Rough per-100g macros for ingredients referenced by seed dishes. Only the
// ingredients actually used are inserted; the grocery list (v2) builds on these.
const INGREDIENT_MACROS: Record<
  string,
  { kcal: number; proteinG: number; carbsG: number; fatG: number; tags: string[] }
> = {
  "Long-grain rice": { kcal: 360, proteinG: 7, carbsG: 79, fatG: 1, tags: ["grain", "budget"] },
  "Chicken (bone-in)": { kcal: 170, proteinG: 25, carbsG: 0, fatG: 8, tags: ["protein"] },
  Tomato: { kcal: 18, proteinG: 1, carbsG: 4, fatG: 0, tags: ["vegetable"] },
  Onion: { kcal: 40, proteinG: 1, carbsG: 9, fatG: 0, tags: ["vegetable"] },
  "Vegetable oil": { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, tags: ["fat"] },
  "Palm oil": { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, tags: ["fat"] },
  Cassava: { kcal: 160, proteinG: 1, carbsG: 38, fatG: 0, tags: ["starch", "budget"] },
  Plantain: { kcal: 122, proteinG: 1, carbsG: 32, fatG: 0, tags: ["starch", "budget"] },
  "Groundnut paste": { kcal: 588, proteinG: 25, carbsG: 20, fatG: 50, tags: ["protein", "fat"] },
  "Black-eyed beans": { kcal: 336, proteinG: 23, carbsG: 60, fatG: 1, tags: ["protein", "high-fibre", "budget"] },
};

async function main() {
  console.log(`Seeding ${DISHES.length} dishes...`);

  for (const dish of DISHES) {
    // Upsert any ingredients this dish references.
    const ingredientLinks = [];
    for (const item of dish.ingredients ?? []) {
      const macros = INGREDIENT_MACROS[item.name];
      if (!macros) {
        console.warn(`  ! No macro profile for ingredient "${item.name}" — skipping link.`);
        continue;
      }
      const ingredient = await prisma.ingredient.upsert({
        where: { name: item.name },
        create: { name: item.name, ...macros },
        update: {},
      });
      ingredientLinks.push({ ingredientId: ingredient.id, grams: item.grams });
    }

    await prisma.dish.upsert({
      where: { slug: dish.slug },
      update: {
        name: dish.name,
        cuisine: dish.cuisine,
        slots: dish.slots,
        servings: dish.servings,
        kcal: dish.kcal,
        proteinG: dish.proteinG,
        carbsG: dish.carbsG,
        fatG: dish.fatG,
        tags: dish.tags,
        prepTimeMin: dish.prepTimeMin ?? null,
        shortDesc: dish.shortDesc ?? null,
      },
      create: {
        slug: dish.slug,
        name: dish.name,
        cuisine: dish.cuisine,
        slots: dish.slots,
        servings: dish.servings,
        kcal: dish.kcal,
        proteinG: dish.proteinG,
        carbsG: dish.carbsG,
        fatG: dish.fatG,
        tags: dish.tags,
        prepTimeMin: dish.prepTimeMin ?? null,
        shortDesc: dish.shortDesc ?? null,
        ingredients: {
          create: ingredientLinks,
        },
      },
    });
  }

  const [dishCount, ingredientCount, ghanaian] = await Promise.all([
    prisma.dish.count(),
    prisma.ingredient.count(),
    prisma.dish.count({ where: { cuisine: "GHANAIAN" } }),
  ]);

  console.log(
    `Done. ${dishCount} dishes (${ghanaian} Ghanaian), ${ingredientCount} ingredients.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
