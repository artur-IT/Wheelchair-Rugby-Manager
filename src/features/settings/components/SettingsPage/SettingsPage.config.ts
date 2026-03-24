import { queryKeys } from "@/lib/queryKeys";
import type { PersonnelConfig } from "@/features/settings/components/SettingsPage/types";

export const REFEREES_CONFIG: PersonnelConfig = {
  apiEndpoint: "/api/referees",
  queryKey: (seasonId) => queryKeys.referees.bySeason(seasonId),
  title: "Sędziowie",
  noSeasonMessage: "Wybierz sezon, aby zarządzać sędziami.",
  emptyMessage: "Brak zapisanych sędziów. Dodaj pierwszego sędziego, aby rozdzielać mecze.",
  emptyActionLabel: "Dodaj Sędziego",
  dialogTitles: {
    add: "Dodaj Sędziego",
    edit: "Edytuj Sędziego",
  },
  deleteDialogTitle: "Usuń sędziego",
  messages: {
    loadError: "Nie udało się pobrać sędziów",
    loadFallback: "Wystąpił błąd podczas pobierania sędziów",
    createFallback: "Wystąpił błąd podczas zapisu sędziego",
    updateFallback: "Wystąpił błąd podczas zapisu sędziego",
    deleteFallback: "Wystąpił błąd podczas usuwania",
  },
};

export const CLASSIFIERS_CONFIG: PersonnelConfig = {
  apiEndpoint: "/api/classifiers",
  queryKey: (seasonId) => queryKeys.classifiers.bySeason(seasonId),
  title: "Klasyfikatorzy",
  noSeasonMessage: "Wybierz sezon, aby zarządzać klasyfikatorami.",
  emptyMessage: "Brak zapisanych klasyfikatorów. Dodaj pierwszą osobę, aby uruchomić egzaminy.",
  emptyActionLabel: "Dodaj Klasyfikatora",
  dialogTitles: {
    add: "Dodaj Klasyfikatora",
    edit: "Edytuj Klasyfikatora",
  },
  deleteDialogTitle: "Usuń klasyfikatora",
  messages: {
    loadError: "Nie udało się pobrać klasyfikatorów",
    loadFallback: "Wystąpił błąd podczas pobierania klasyfikatorów",
    createFallback: "Wystąpił błąd podczas zapisu klasyfikatora",
    updateFallback: "Wystąpił błąd podczas zapisu klasyfikatora",
    deleteFallback: "Wystąpił błąd podczas usuwania",
  },
};
