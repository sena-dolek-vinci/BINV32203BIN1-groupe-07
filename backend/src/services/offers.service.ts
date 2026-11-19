import { toOffer } from "../mappers/offer.mapper.ts";
import type { Offer, PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import type { OfferFilter, OffersRepository } from "../repositories/offers.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { hasContactRole, isAdmin, isStudent } from "./permissions.ts";

/**
 * Offres visibles selon le profil (CdC § 4) : toutes pour l'administrateur, les offres
 * publiées pour l'étudiant, les offres qu'il a déposées pour un déposant.
 */
const visibilityFilter = (
  viewer: User,
  periodCode?: PeriodCode,
  search?: string,
): OfferFilter => {
  let filter: OfferFilter;
  if (isAdmin(viewer)) {
    filter = {};
  } else if (isStudent(viewer)) {
    filter = { status: "PUBLISHED" };
  } else if (hasContactRole(viewer, "DEPOSITOR")) {
    filter = { depositorContactId: viewer.id };
  } else {
    throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès aux offres");
  }

  return { ...filter, periodCode, search };
};

export const createOffersService = (repository: OffersRepository) => ({
  listOffers: (viewer: User, periodCode?: PeriodCode, search?: string): Offer[] =>
    repository.findAll(visibilityFilter(viewer, periodCode, search)).map(toOffer),
});

export type OffersService = ReturnType<typeof createOffersService>;
