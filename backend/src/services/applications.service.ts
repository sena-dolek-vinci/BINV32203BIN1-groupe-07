import { toApplication } from "../mappers/application.mapper.ts";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { isStudent } from "./permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const ACTIVE_OR_PROCESSED_STATUSES = new Set(["IN_PROGRESS", "SELECTED", "REJECTED"]);
const DUPLICATE_INDEX = "applications_one_active_per_student_offer";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  apply: (viewer: User, offerId: number, message: string | null): Application => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater");
    }

    const offerStatus = repository.findOfferStatus(offerId);
    if (offerStatus === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (offerStatus !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "L'offre n'est pas publiée");
    }

    const existing = repository.findExisting(offerId, viewer.id);
    if (existing.some(({ status }) => ACTIVE_OR_PROCESSED_STATUSES.has(status))) {
      throw new HttpError(
        409,
        "APPLICATION_ALREADY_EXISTS",
        "Vous avez déjà une candidature pour cette offre",
      );
    }

    try {
      return toApplication(repository.insert(offerId, viewer.id, message));
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes(DUPLICATE_INDEX)) {
        throw new HttpError(
          409,
          "APPLICATION_ALREADY_EXISTS",
          "Vous avez déjà une candidature pour cette offre",
        );
      }
      throw error;
    }
  },
  listMine: (viewer: User) => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut consulter ses candidatures");
    }
    return repository.findForStudent(viewer.id);
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
