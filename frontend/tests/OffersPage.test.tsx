import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const offers = [
  {
    id: 2,
    title: "Refonte du portail client",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    status: "SUBMITTED",
  },
  {
    id: 5,
    title: "Tableau de bord de qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "OTHER",
    status: "ASSIGNED",
  },
];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    expect(screen.getByText("Autre", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("2 offres")).toBeInTheDocument();
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrer par période" })).toHaveValue("");
  });

  it.each([
    ["P1", "P1"],
    ["P2", "P2"],
    ["Autre", "OTHER"],
  ])("actualise la liste après sélection de %s", async (_label, value) => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    const select = await screen.findByRole("combobox", { name: "Filtrer par période" });

    fireEvent.change(select, { target: { value } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/offers?period=${value}`,
        expect.objectContaining({
          headers: { Authorization: "jeton" },
        }),
      );
    });
    expect(select).toHaveValue(value);
  });

  it("adapte la description au profil", async () => {
    stubFetch({ "/api/offers": () => Response.json([]) });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("permet à un étudiant de candidater avec un message facultatif", async () => {
    stubFetch({
      "/api/offers": () => Response.json(offers),
      "/api/applications": () =>
        Response.json({
          id: 20,
          offerId: 2,
          message: "Mon message",
          status: "IN_PROGRESS",
          appliedAt: "2026-11-03 15:00:00",
        }),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");
    fireEvent.click(screen.getAllByRole("button", { name: "Candidater" })[0]!);
    fireEvent.change(screen.getByRole("textbox", { name: "Message de candidature" }), {
      target: { value: "Mon message" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("bien été envoyée");
    });
  });

  it("affiche l'erreur de doublon renvoyée par le backend", async () => {
    stubFetch({
      "/api/offers": () => Response.json(offers),
      "/api/applications": () =>
        Response.json(
          { error: { code: "APPLICATION_ALREADY_EXISTS", message: "Vous avez déjà candidaté" } },
          { status: 409 },
        ),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");
    fireEvent.click(screen.getAllByRole("button", { name: "Candidater" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("déjà candidaté"));
  });
});
