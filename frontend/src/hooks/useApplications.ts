import { useCallback, useEffect, useState } from "react";
import type { StudentApplication } from "../models/application.ts";
import { getMyApplications } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = () => {
      setIsLoading(true);
      setError(null);
      getMyApplications(token, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setApplications(data);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          if (isUnauthorized(reason)) {
            onUnauthorized();
          } else {
            setError(reason instanceof Error ? reason.message : "Erreur inconnue");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    };

    load();

    return () => controller.abort();
  }, [token, onUnauthorized, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { applications, isLoading, error, reload };
};
