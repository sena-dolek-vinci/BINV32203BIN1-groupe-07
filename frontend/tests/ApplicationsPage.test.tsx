import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Application mobile",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    message: "Mon message",
    appliedAt: "2026-10-02 18:10:00",
    status: "IN_PROGRESS",
  },
  {
    id: 2,
    offerId: 2,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    academicYear: "2026-2027",
    period: "P1",
    message: null,
    appliedAt: "2026-09-22 12:00:00",
    status: "SELECTED",
  },
  {
    id: 3,
    offerId: 2,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    academicYear: "2026-2027",
    period: "P1",
    message: null,
    appliedAt: "2026-09-23 17:25:00",
    status: "REJECTED",
  },
  {
    id: 4,
    offerId: 1,
    offerTitle: "Application mobile",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    message: null,
    appliedAt: "2026-09-01 10:00:00",
    status: "WITHDRAWN",
  },
];

describe("ApplicationsPage", () => {
  it("affiche les informations et les quatre statuts en français", async () => {
    stubFetch({ "/api/applications/me": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Mes candidatures" })).toBeInTheDocument();
    expect(screen.getAllByText("Application mobile")).toHaveLength(2);
    expect(screen.getByText("Mon message")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
    expect(screen.getAllByText("Migration cloud")).toHaveLength(2);
  });

  it("affiche un état vide", async () => {
    stubFetch({ "/api/applications/me": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Vous n'avez encore aucune candidature.")).toBeInTheDocument();
  });

  it("affiche les erreurs de chargement", async () => {
    stubFetch({ "/api/applications/me": () => new Response(null, { status: 500 }) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Chargement des candidatures");
  });

  it("signale une session expirée", async () => {
    const onUnauthorized = vi.fn();
    stubFetch({ "/api/applications/me": () => new Response(null, { status: 401 }) });

    render(<ApplicationsPage token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
