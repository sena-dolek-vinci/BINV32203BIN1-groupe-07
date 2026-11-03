import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import type { PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const PERIOD_OPTIONS: { value: PeriodCode | ""; label: string }[] = [
  { value: "", label: "Toutes les périodes" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "OTHER", label: "Autre" },
];

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | "">("");
  const [applicationOfferId, setApplicationOfferId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationFeedback, setApplicationFeedback] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const { offers, isLoading, error } = useOffers(
    token,
    onUnauthorized,
    period === "" ? undefined : period,
  );

  const submitApplication = async () => {
    if (applicationOfferId === null) return;
    setApplicationFeedback(null);
    setApplicationError(null);
    try {
      await createApplication(token, applicationOfferId, applicationMessage);
      setApplicationFeedback("Votre candidature a bien été envoyée.");
      setApplicationMessage("");
      setApplicationOfferId(null);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setApplicationError(reason instanceof Error ? reason.message : "Candidature impossible");
      }
    }
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable
          offers={offers}
          canApply={user.kind === "STUDENT"}
          onApply={(offerId) => {
            setApplicationOfferId(offerId);
            setApplicationFeedback(null);
            setApplicationError(null);
          }}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      {applicationFeedback && <p role="status">{applicationFeedback}</p>}
      {applicationError && <p role="alert">{applicationError}</p>}
      <label>
        Période
        <select
          aria-label="Filtrer par période"
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodCode | "")}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {renderContent()}
      {applicationOfferId !== null && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitApplication();
          }}
        >
          <label>
            Message (facultatif)
            <textarea
              aria-label="Message de candidature"
              value={applicationMessage}
              onChange={(event) => setApplicationMessage(event.target.value)}
            />
          </label>
          <button type="submit">Envoyer ma candidature</button>
          <button type="button" onClick={() => setApplicationOfferId(null)}>
            Annuler
          </button>
        </form>
      )}
    </section>
  );
};

export default OffersPage;
