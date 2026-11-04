import { ChipGroup } from "@/shared/components/chip-group";
import { FUEL_LABELS, FUEL_TYPES, type FuelType } from "../model/fuel-types";

type FuelChipsProps = {
  value: FuelType;
  onChange: (fuel: FuelType) => void;
};

const FUEL_OPTIONS = FUEL_TYPES.map((fuel) => ({
  value: fuel,
  label: FUEL_LABELS[fuel],
}));

export const FuelChips = ({ value, onChange }: FuelChipsProps) => (
  <ChipGroup
    legend="Carburant"
    options={FUEL_OPTIONS}
    value={value}
    onChange={onChange}
  />
);
