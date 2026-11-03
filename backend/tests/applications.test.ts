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

describe("POST /applications", () => {
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
