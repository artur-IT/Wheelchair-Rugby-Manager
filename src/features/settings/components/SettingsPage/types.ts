import type { Person } from "@/types";

export type TabValue = "teams" | "referees" | "classifiers";

export interface PersonFormPayload {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface PersonnelTableProps {
  title: string;
  data: Person[];
  onAddClick: () => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
  deletingId?: string | null;
}

export interface PersonnelConfig {
  apiEndpoint: string;
  queryKey: (seasonId: string) => readonly unknown[];
  title: string;
  noSeasonMessage: string;
  emptyMessage: string;
  emptyActionLabel: string;
  dialogTitles: {
    add: string;
    edit: string;
  };
  deleteDialogTitle: string;
  messages: {
    loadError: string;
    loadFallback: string;
    createFallback: string;
    updateFallback: string;
    deleteFallback: string;
  };
}

export interface PersonnelTabProps {
  seasonId: string;
  config: PersonnelConfig;
}

export interface PersonFormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
