const MODIFIER_LABELS: Record<string, string> = {
  left: "à gauche",
  right: "à droite",
  "slight left": "légèrement à gauche",
  "slight right": "légèrement à droite",
  "sharp left": "franchement à gauche",
  "sharp right": "franchement à droite",
  straight: "tout droit",
  uturn: "en demi-tour",
};

const withDirection = (verb: string, modifier: string | null | undefined) => {
  const direction = modifier == null ? undefined : MODIFIER_LABELS[modifier];
  return direction === undefined ? verb : `${verb} ${direction}`;
};

// Traduit une manœuvre de l'API en phrase française. Les noms de rues ne sont
// pas utilisés : l'API les renvoie tronqués.
export const describeInstruction = (
  type: string,
  modifier: string | null | undefined,
): string => {
  switch (type) {
    case "depart":
      return "Démarrer";
    case "arrive":
      return withDirection("Vous êtes arrivé, la station est", modifier);
    case "turn":
      return withDirection("Tourner", modifier);
    case "end of road":
      return withDirection("Au bout de la route, tourner", modifier);
    case "fork":
      return withDirection("À l'embranchement, prendre", modifier);
    case "on ramp":
      return withDirection("Prendre la bretelle", modifier);
    case "off ramp":
      return withDirection("Quitter par la sortie", modifier);
    case "merge":
      return "S'insérer sur la voie";
    case "roundabout":
    case "rotary":
      return "Au rond-point, prendre la sortie indiquée";
    case "new name":
    case "continue":
      return "Continuer tout droit";
    default:
      return "Continuer";
  }
};
