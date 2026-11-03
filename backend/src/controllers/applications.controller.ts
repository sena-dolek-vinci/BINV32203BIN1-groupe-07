import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

const parseBody = (body: unknown): { offerId: number; message: string | null } => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_BODY", "Le corps de la requête est invalide");
  }

  const parsedBody = body as { offerId?: unknown; message?: unknown };
  const { offerId, message } = parsedBody;
  if (typeof offerId !== "number" || !Number.isInteger(offerId) || offerId <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }
  if (message !== undefined && typeof message !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
  }

  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  return { offerId, message: normalizedMessage === "" ? null : normalizedMessage };
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.post("/", (req, res) => {
    const { offerId, message } = parseBody(req.body);
    const application = applicationsService.apply(getCurrentUser(req), offerId, message);
    res.status(201).json(toApplicationDto(application));
  });

  return router;
};
