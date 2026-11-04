// Jeu « Bornes de recharge pour véhicules électriques » (IRVE consolidé) publié
// par l'ODRE : gratuit, sans clé, CORS ouvert, Licence Ouverte 2.0.
export const IRVE_RECORDS_URL =
  "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records";

// Les champs `coordonneesxy` et `geo_point_borne` sont inutilisables
// (longitude et latitude inversées, ou vides) : on filtre sur les champs
// consolidés.
export const LATITUDE_FIELD = "consolidated_latitude";
export const LONGITUDE_FIELD = "consolidated_longitude";
