"use client";

import dynamic from "next/dynamic";

// Les réglages sont relus du stockage local (propre à chaque navigateur) : la
// page est donc rendue côté navigateur uniquement, pour éviter tout écart avec
// le HTML pré-généré.
const Comparator = dynamic(
  () =>
    import("./comparator").then((module) => ({ default: module.Comparator })),
  { ssr: false },
);

export const ComparatorPageClient = () => <Comparator />;
