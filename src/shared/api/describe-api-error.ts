import { ApiError } from "./http-client";

export const describeApiError = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return "Une erreur inattendue est survenue.";
  }

  switch (error.kind) {
    case "timeout":
      return "Le service met trop de temps à répondre. Réessayez dans un instant.";
    case "network":
      return "Impossible de joindre le service. Vérifiez votre connexion.";
    case "http":
      return `Le service est momentanément indisponible (erreur ${error.status ?? "inconnue"}).`;
    case "invalid-data":
      return "Le service a renvoyé des données inattendues.";
  }
};
