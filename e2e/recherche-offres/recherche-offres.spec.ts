import { expect, test, type Page } from "@playwright/test";

const signInAsLouisAndOpenOffers = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Louis Claes", exact: true }).click();
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Rechercher par titre" });
  const period = page.getByRole("combobox", { name: "Filtrer par période" });
  await expect(search).toHaveValue("");
  await expect(period).toHaveValue("");
  await expect(
    page.getByRole("row", { name: /Application React de gestion de flotte/ }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /API REST de facturation/ })).toBeVisible();

  return search;
};

test("Scénario 1 — REACT affiche uniquement l’offre publiée correspondante", async ({
  page,
}) => {
  const search = await signInAsLouisAndOpenOffers(page);

  await search.fill("REACT");

  const results = page.getByRole("table").getByRole("row");
  await expect(
    page.getByRole("row", { name: /Application React de gestion de flotte/ }),
  ).toContainText("Publiée");
  await expect(results).toHaveCount(2);
  await expect(page.getByRole("row", { name: /API REST de facturation/ })).toHaveCount(0);
});

test("Scénario 2 — xyz123 affiche le message d’absence de résultats sans erreur", async ({
  page,
}) => {
  const search = await signInAsLouisAndOpenOffers(page);

  await search.fill("xyz123");

  await expect(page.getByText("Aucune offre ne correspond à la recherche.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
