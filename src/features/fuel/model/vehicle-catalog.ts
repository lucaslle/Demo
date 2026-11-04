// Modèles courants en France avec la capacité de leur réservoir. Aucune donnée
// ouverte ne publie ces volumes : ils sont saisis à la main, donnés à titre
// indicatif et toujours modifiables par l'utilisateur.
export type CatalogVehicle = {
  label: string;
  tankLiters: number;
};

export const VEHICLE_CATALOG: readonly CatalogVehicle[] = [
  { label: "Audi A3 (2020+)", tankLiters: 50 },
  { label: "BMW Série 1 (2019+)", tankLiters: 42 },
  { label: "Citroën C3 (2017+)", tankLiters: 45 },
  { label: "Citroën C3 Aircross", tankLiters: 45 },
  { label: "Citroën C4 (2021+)", tankLiters: 50 },
  { label: "Citroën Berlingo (2018+)", tankLiters: 50 },
  { label: "Dacia Duster (2018+)", tankLiters: 50 },
  { label: "Dacia Jogger", tankLiters: 50 },
  { label: "Dacia Sandero (2021+)", tankLiters: 50 },
  { label: "Fiat 500 (2007+)", tankLiters: 35 },
  { label: "Fiat Panda (2012+)", tankLiters: 37 },
  { label: "Ford Fiesta (2017+)", tankLiters: 42 },
  { label: "Ford Focus (2018+)", tankLiters: 47 },
  { label: "Ford Puma", tankLiters: 42 },
  { label: "Hyundai i20 (2020+)", tankLiters: 40 },
  { label: "Hyundai Tucson (2021+)", tankLiters: 54 },
  { label: "Kia Sportage (2022+)", tankLiters: 54 },
  { label: "Nissan Juke (2020+)", tankLiters: 46 },
  { label: "Nissan Qashqai (2021+)", tankLiters: 55 },
  { label: "Opel Corsa (2019+)", tankLiters: 44 },
  { label: "Opel Mokka (2021+)", tankLiters: 44 },
  { label: "Peugeot 208 (2019+)", tankLiters: 44 },
  { label: "Peugeot 2008 (2019+)", tankLiters: 44 },
  { label: "Peugeot 308 (2021+)", tankLiters: 52 },
  { label: "Peugeot 3008 (2016+)", tankLiters: 53 },
  { label: "Peugeot 5008 (2017+)", tankLiters: 53 },
  { label: "Renault Captur (2019+)", tankLiters: 48 },
  { label: "Renault Clio V (2019+)", tankLiters: 42 },
  { label: "Renault Mégane IV (2016+)", tankLiters: 50 },
  { label: "Renault Twingo III (2014+)", tankLiters: 35 },
  { label: "Seat Ibiza (2017+)", tankLiters: 40 },
  { label: "Seat Leon (2020+)", tankLiters: 50 },
  { label: "Skoda Octavia (2020+)", tankLiters: 45 },
  { label: "Toyota Corolla (2019+)", tankLiters: 43 },
  { label: "Toyota Yaris (2020+)", tankLiters: 36 },
  { label: "Volkswagen Golf VIII (2019+)", tankLiters: 50 },
  { label: "Volkswagen Polo (2017+)", tankLiters: 40 },
  { label: "Volkswagen T-Roc", tankLiters: 50 },
  { label: "Volkswagen Tiguan (2016+)", tankLiters: 58 },
];

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

// Retrouve un modèle du catalogue à partir du texte saisi ou choisi dans la
// liste de suggestions (sans tenir compte de la casse ni des accents).
export const findCatalogVehicle = (
  label: string,
): CatalogVehicle | undefined => {
  const wanted = normalize(label);
  return wanted === ""
    ? undefined
    : VEHICLE_CATALOG.find((vehicle) => normalize(vehicle.label) === wanted);
};
