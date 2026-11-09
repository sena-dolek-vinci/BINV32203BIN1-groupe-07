import { useState } from "react";
import ApplicationTable from "../components/ApplicationTable.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { withdrawApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, reload } = useApplications(token, onUnauthorized);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async (applicationId: number) => {
    if (!window.confirm("Voulez-vous retirer cette candidature ?")) return;
    setActionError(null);
    setIsWithdrawing(true);
    try {
      await withdrawApplication(token, applicationId);
      reload();
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setActionError(reason instanceof Error ? reason.message : "Retrait impossible");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (applications.length === 0) {
    return (
      <section>
        <h1>Mes candidatures</h1>
        {actionError && <ErrorState message={actionError} />}
        <EmptyState message="Vous n'avez encore aucune candidature." />
      </section>
    );
  }

  return (
    <section>
      <h1>Mes candidatures</h1>
      {actionError && <ErrorState message={actionError} />}
      {isWithdrawing && <LoadingState message="Retrait de la candidature…" />}
      <p>{applications.length} candidature{applications.length > 1 ? "s" : ""}</p>
      <ApplicationTable applications={applications} onWithdraw={handleWithdraw} />
    </section>
  );
};

export default ApplicationsPage;
