import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";
import type { OfferStatus } from "../models/offer.ts";

interface CreateApplicationParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

interface ExistingApplicationParams {
  offerId: number;
  studentId: number;
}

interface OfferStatusRow {
  status: OfferStatus;
}

export const createApplicationsRepository = (db: Db) => {
  const findOfferStatus = db.prepare<{ offerId: number }, OfferStatusRow>(`
    SELECT status
    FROM offers
    WHERE id = @offerId
  `);
  const findExisting = db.prepare<ExistingApplicationParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE offer_id = @offerId AND student_id = @studentId
    ORDER BY id DESC
  `);
  const insertApplication = db.prepare<CreateApplicationParams, ApplicationDbo>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
    RETURNING id, offer_id, student_id, message, status, applied_at
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get({ offerId })?.status,
    findExisting: (offerId: number, studentId: number): ApplicationDbo[] =>
      findExisting.all({ offerId, studentId }),
    insert: (offerId: number, studentId: number, message: string | null): ApplicationDbo =>
      insertApplication.get({ offerId, studentId, message }) as ApplicationDbo,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
