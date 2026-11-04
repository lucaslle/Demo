"use client";

import { MapPin, Search } from "lucide-react";
import { useId, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { describeApiError } from "@/shared/api/describe-api-error";
import type { PlaceScope } from "../api/places-api";
import { usePlaceSearch } from "../hooks/use-places";
import {
  MAX_PLACE_QUERY_LENGTH,
  MIN_PLACE_QUERY_LENGTH,
  type Place,
} from "../model/place";
import styles from "./place-search.module.css";

const SEARCH_DEBOUNCE_IN_MS = 350;

type PlaceSearchProps = {
  label: string;
  placeholder: string;
  // "municipality" : communes seulement ; "any" : adresses comprises.
  scope: PlaceScope;
  initialQuery?: string;
  onSelect: (place: Place) => void;
};

// Recherche de lieu avec liste de résultats. Les résultats sont des boutons
// ordinaires : utilisables au clavier et par les lecteurs d'écran, sans
// composant « combobox » à piloter à la main.
export const PlaceSearch = ({
  label,
  placeholder,
  scope,
  initialQuery = "",
  onSelect,
}: PlaceSearchProps) => {
  const inputId = useId();
  const [queryInput, setQueryInput] = useState(initialQuery);
  // Après un choix, la liste se ferme jusqu'à ce que le texte change.
  const [pickedLabel, setPickedLabel] = useState<string | null>(
    initialQuery === "" ? null : initialQuery,
  );
  const debouncedQuery = useDebouncedValue(queryInput, SEARCH_DEBOUNCE_IN_MS);
  const searchQuery = usePlaceSearch(debouncedQuery, scope);

  const isOpen =
    pickedLabel !== queryInput &&
    queryInput.trim().length >= MIN_PLACE_QUERY_LENGTH;
  const places = searchQuery.data ?? [];
  const isSearching =
    isOpen && (queryInput !== debouncedQuery || searchQuery.isFetching);

  const handlePick = (place: Place) => {
    setQueryInput(place.label);
    setPickedLabel(place.label);
    onSelect(place);
  };

  return (
    <div className={styles.search}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <Search size={18} aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={queryInput}
          maxLength={MAX_PLACE_QUERY_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => setQueryInput(event.target.value)}
        />
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {isOpen && !isSearching
          ? places.length === 0
            ? "Aucun lieu trouvé."
            : `${places.length} lieux proposés.`
          : ""}
      </p>
      {isOpen && searchQuery.isError && (
        <p className={styles.message} role="alert">
          {describeApiError(searchQuery.error)}
        </p>
      )}
      {isOpen &&
        !isSearching &&
        !searchQuery.isError &&
        places.length === 0 && (
          <p className={styles.message}>Aucun lieu trouvé.</p>
        )}
      {isOpen && places.length > 0 && (
        <ul className={styles.results} aria-label="Lieux proposés">
          {places.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => handlePick(place)}
              >
                <MapPin size={16} aria-hidden="true" />
                <span>{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
