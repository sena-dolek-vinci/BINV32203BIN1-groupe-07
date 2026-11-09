import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("retire une candidature en cours puis actualise la liste", async () => {
    const fetchMock = stubFetch({
      "/api/applications/me": () => Response.json([applications[0]]),
      "/api/applications/1/withdraw": () =>
        Response.json({ id: 1, offerId: 1, message: "Mon message", status: "WITHDRAWN", appliedAt: "" }),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");

    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/applications/1/withdraw",
        expect.objectContaining({ method: "POST", headers: { Authorization: "jeton" } }),
      );
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  it("n'affiche pas de bouton de retrait pour les candidatures traitées ou retirées", async () => {
    stubFetch({ "/api/applications/me": () => Response.json(applications.slice(1)) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    await screen.findByText("Retirée");
    expect(screen.queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
  });

  it("demande confirmation avant de retirer", async () => {
    stubFetch({ "/api/applications/me": () => Response.json([applications[0]]) });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(confirm).toHaveBeenCalled();
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });

  it("affiche une erreur de retrait", async () => {
    stubFetch({
      "/api/applications/me": () => Response.json([applications[0]]),
      "/api/applications/1/withdraw": () =>
        new Response(
          JSON.stringify({ error: { message: "Cette candidature ne peut plus être retirée" } }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(
      await screen.findByText("Cette candidature ne peut plus être retirée"),
    ).toBeInTheDocument();
  });
});
