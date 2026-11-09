import type { Db } from "../db/database.ts";
import type { ApplicationDbo, StudentApplicationDbo } from "../models/application.ts";
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

interface ApplicationIdParams {
  applicationId: number;
}

interface WithdrawApplicationParams {
  applicationId: number;
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
  const findStudentApplications = db.prepare<{ studentId: number }, StudentApplicationDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year_label, p.code AS period_code
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = @studentId
    ORDER BY ay.start_date DESC, a.applied_at DESC, a.id DESC
  `);
  const findById = db.prepare<ApplicationIdParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE id = @applicationId
  `);
  const withdraw = db.prepare<WithdrawApplicationParams, ApplicationDbo>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = @applicationId
      AND student_id = @studentId
      AND status = 'IN_PROGRESS'
    RETURNING id, offer_id, student_id, message, status, applied_at
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get({ offerId })?.status,
    findExisting: (offerId: number, studentId: number): ApplicationDbo[] =>
      findExisting.all({ offerId, studentId }),
    insert: (offerId: number, studentId: number, message: string | null): ApplicationDbo =>
      insertApplication.get({ offerId, studentId, message }) as ApplicationDbo,
    findForStudent: (studentId: number): StudentApplicationDbo[] =>
      findStudentApplications.all({ studentId }),
    findById: (applicationId: number): ApplicationDbo | undefined =>
      findById.get({ applicationId }),
    withdraw: (applicationId: number, studentId: number): ApplicationDbo | undefined =>
      withdraw.get({ applicationId, studentId }),
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
