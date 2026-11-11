import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { APPLICATION, OFFER, STUDENT, ADMINISTRATOR, CONTACT } from "../src/db/seed/seedIds.ts";
import { createTestDatabase } from "./helpers/testDatabase.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const applyAs = (kind: "ADMIN" | "STUDENT" | "CONTACT", id: number, body: object) =>
  request(app)
    .post("/applications")
    .set("Authorization", tokenFor(kind, id))
    .send(body);

const listMineAs = (kind: "ADMIN" | "STUDENT" | "CONTACT", id: number) =>
  request(app)
    .get("/applications/me")
    .set("Authorization", tokenFor(kind, id));

const withdrawAs = (kind: "ADMIN" | "STUDENT" | "CONTACT", id: number, applicationId: number) =>
  request(app)
    .post(`/applications/${applicationId}/withdraw`)
    .set("Authorization", tokenFor(kind, id));

describe("POST /applications", () => {
  it("refuse une candidature sans authentification", async () => {
    const response = await request(app).post("/applications").send({
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("crée une candidature sans message pour une offre publiée", async () => {
    const response = await applyAs("STUDENT", STUDENT.AMINATA_DIALLO, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.BILLING_API,
      message: null,
      status: "IN_PROGRESS",
    });
    expect(response.body.id).toBeGreaterThan(0);
  });

  it("crée une candidature avec un message", async () => {
    const response = await applyAs("STUDENT", STUDENT.AMINATA_DIALLO, {
      offerId: OFFER.BILLING_API,
      message: "  Je suis très intéressée par ce sujet.  ",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Je suis très intéressée par ce sujet.");
  });

  it("refuse une offre qui n'est pas publiée", async () => {
    const response = await applyAs("STUDENT", STUDENT.AMINATA_DIALLO, {
      offerId: OFFER.PDF_REPORTS,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED");
  });

  it("refuse une offre inexistante", async () => {
    const response = await applyAs("STUDENT", STUDENT.AMINATA_DIALLO, {
      offerId: 999999,
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it.each([
    ["ADMIN", ADMINISTRATOR.ANNE_LECLERCQ],
    ["CONTACT", CONTACT.MARC_LEJEUNE],
  ] as const)("refuse un utilisateur %s", async (kind, id) => {
    const response = await applyAs(kind, id, { offerId: OFFER.BILLING_API });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it.each([
    [STUDENT.LUCAS_DUPONT, OFFER.FLEET_APP, "IN_PROGRESS"],
    [STUDENT.MATEUSZ_KOWALSKI, OFFER.CLOUD_MIGRATION, "SELECTED"],
    [STUDENT.LEA_MERTENS, OFFER.CLOUD_MIGRATION, "REJECTED"],
  ] as const)("refuse un doublon avec le statut %s", async (studentId, offerId, status) => {
    const testDatabase = createTestDatabase();
    if (status !== "IN_PROGRESS") {
      testDatabase.prepare("UPDATE offers SET status = 'PUBLISHED' WHERE id = ?").run(offerId);
    }
    const response = await request(createTestApp(testDatabase))
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", studentId))
      .send({ offerId });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_ALREADY_EXISTS");
  });

  it("autorise une nouvelle candidature après un retrait", async () => {
    const response = await applyAs("STUDENT", STUDENT.INES_HADDAD, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
    expect(response.body.id).not.toBe(APPLICATION.INES_BILLING_API);
  });
});

describe("GET /applications/me", () => {
  it("refuse la consultation sans authentification", async () => {
    const response = await request(app).get("/applications/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("n'expose pas les candidatures d'un autre étudiant", async () => {
    const database = createTestDatabase();
    const response = await request(createTestApp(database))
      .get("/applications/me")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    const applicationIds = response.body.map((application: { id: number }) => application.id);

    expect(response.status).toBe(200);
    expect(applicationIds).toContain(APPLICATION.LUCAS_FLEET_APP);
    expect(applicationIds).not.toContain(APPLICATION.MATEUSZ_CLOUD_MIGRATION);
  });

  it("retourne uniquement les candidatures de l'étudiant connecté", async () => {
    const response = await listMineAs("STUDENT", STUDENT.LUCAS_DUPONT);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: APPLICATION.LUCAS_FLEET_APP,
      offerId: OFFER.FLEET_APP,
      offerTitle: "Application React de gestion de flotte",
      companyShortName: "Lumen Digital",
      academicYear: "2026-2027",
      period: "P2",
      status: "IN_PROGRESS",
    });

    expect(response.body[0]).not.toHaveProperty("studentId");
  });

  it.each([
    ["ADMIN", ADMINISTRATOR.ANNE_LECLERCQ],
    ["CONTACT", CONTACT.MARC_LEJEUNE],
  ] as const)("refuse l'accès à un %s", async (kind, id) => {
    const response = await listMineAs(kind, id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("conserve les candidatures retirées et sépare les historiques", async () => {
    const database = createTestDatabase();
    database
      .prepare(
        `INSERT INTO applications (offer_id, student_id, message, status)
         VALUES (?, ?, ?, 'WITHDRAWN')`,
      )
      .run(OFFER.BILLING_API, STUDENT.LUCAS_DUPONT, "Ancienne candidature");
    database
      .prepare(
        `INSERT INTO applications (offer_id, student_id, message, status)
         VALUES (?, ?, ?, 'WITHDRAWN')`,
      )
      .run(OFFER.BILLING_API, STUDENT.LUCAS_DUPONT, "Deuxième candidature retirée");

    const response = await request(createTestApp(database))
      .get("/applications/me")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(200);
    expect(response.body.filter((application: { offerId: number }) =>
      application.offerId === OFFER.BILLING_API,
    )).toHaveLength(2);
    expect(response.body.map((application: { status: string }) => application.status)).toContain(
      "WITHDRAWN",
    );
  });
});

describe("POST /applications/:applicationId/withdraw", () => {
  it("refuse le retrait sans authentification", async () => {
    const response = await request(app).post(
      `/applications/${APPLICATION.LUCAS_FLEET_APP}/withdraw`,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("retire une candidature en cours et la conserve dans l'historique", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: APPLICATION.LUCAS_FLEET_APP,
      status: "WITHDRAWN",
    });

    const history = await listMineAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].status).toBe("WITHDRAWN");
  });

  it("refuse le retrait d'une candidature appartenant à un autre étudiant", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.INES_HADDAD, APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it.each([
    ["SELECTED", APPLICATION.MATEUSZ_CLOUD_MIGRATION, STUDENT.MATEUSZ_KOWALSKI],
    ["REJECTED", APPLICATION.LEA_CLOUD_MIGRATION, STUDENT.LEA_MERTENS],
    ["WITHDRAWN", APPLICATION.INES_BILLING_API, STUDENT.INES_HADDAD],
  ] as const)("refuse le retrait d'une candidature %s", async (_status, applicationId, studentId) => {
    const response = await withdrawAs("STUDENT", studentId, applicationId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
  });

  it.each([
    ["ADMIN", ADMINISTRATOR.ANNE_LECLERCQ],
    ["CONTACT", CONTACT.MARC_LEJEUNE],
  ] as const)("refuse le retrait à un %s", async (kind, id) => {
    const response = await withdrawAs(kind, id, APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("autorise ensuite une nouvelle candidature sur la même offre", async () => {
    const withdrawal = await withdrawAs(
      "STUDENT",
      STUDENT.LUCAS_DUPONT,
      APPLICATION.LUCAS_FLEET_APP,
    );
    expect(withdrawal.status).toBe(200);

    const repost = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });

    expect(repost.status).toBe(201);
    expect(repost.body.status).toBe("IN_PROGRESS");
    expect(repost.body.id).not.toBe(APPLICATION.LUCAS_FLEET_APP);
  });

  it("refuse un identifiant invalide", async () => {
    const response = await request(app)
      .post("/applications/not-an-id/withdraw")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_PARAMETER");
  });
});
