import { Router } from "express";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canListOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const parsePeriod = (value: unknown): PeriodCode | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(PERIOD_CODES as readonly string[]).includes(value)) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      "Le paramètre period doit être P1, P2 ou OTHER et apparaître une seule fois",
    );
  }
  return value as PeriodCode;
};

const parseSearch = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre q doit apparaître une seule fois");
  }
  const search = value.trim();
  return search === "" ? undefined : search;
};

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    const period = parsePeriod(req.query.period);
    const search = parseSearch(req.query.q);
    res.json(offersService.listOffers(getCurrentUser(req), period, search).map(toOfferDto));
  });

  return router;
};
