import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Person } from "@/types";
import { createPersonnel, deletePersonnel, fetchPersonnelBySeason, updatePersonnel } from "@/lib/api/personnel";
import type {
  PersonFormFields,
  PersonFormPayload,
  PersonnelConfig,
} from "@/features/settings/components/SettingsPage/types";

const toInitialValues = (person: Person | null): PersonFormFields | undefined =>
  person
    ? {
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email ?? "",
        phone: person.phone ? String(person.phone) : "",
      }
    : undefined;

interface UsePersonnelTabResult {
  people: Person[];
  loading: boolean;
  loadError: string | null;
  refetch: () => void;
  dialogOpen: boolean;
  dialogError: string | null;
  deleteTarget: Person | null;
  isDeleteError: boolean;
  deleteError: unknown;
  submitting: boolean;
  isDeletePending: boolean;
  deletingId: string | null;
  dialogTitle: string;
  submitLabel: string;
  initialValues?: PersonFormFields;
  handleAddClick: () => void;
  handleEditClick: (person: Person) => void;
  handleDeleteClick: (person: Person) => void;
  handleDeleteClose: () => void;
  handleDeleteConfirmed: () => void;
  handleDialogClose: () => void;
  handleDialogSubmit: (payload: PersonFormPayload) => void;
}

export function usePersonnelTab(seasonId: string, config: PersonnelConfig): UsePersonnelTabResult {
  const queryClient = useQueryClient();
  const { apiEndpoint, queryKey, dialogTitles, messages } = config;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);

  const invalidateList = () => {
    if (!seasonId) return;
    void queryClient.invalidateQueries({ queryKey: queryKey(seasonId) });
  };

  const {
    data: people = [],
    isPending: loading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKey(seasonId || "__none__"),
    queryFn: ({ signal }) => {
      if (!seasonId) return Promise.reject(new Error("Brak sezonu"));
      return fetchPersonnelBySeason(apiEndpoint, seasonId, messages.loadError, signal);
    },
    enabled: Boolean(seasonId),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PersonFormPayload) => {
      if (!seasonId) throw new Error("Brak sezonu");
      return createPersonnel(apiEndpoint, { ...payload, seasonId });
    },
    onMutate: async (payload) => {
      const targetSeasonId = seasonId;
      await queryClient.cancelQueries({ queryKey: queryKey(targetSeasonId) });
      const previousPeople = queryClient.getQueryData<Person[]>(queryKey(targetSeasonId)) ?? [];
      const optimisticPerson: Person = {
        id: `optimistic-${crypto.randomUUID()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email ?? undefined,
        phone: payload.phone,
      };
      queryClient.setQueryData<Person[]>(queryKey(targetSeasonId), (current) => [...(current ?? []), optimisticPerson]);
      return { previousPeople, targetSeasonId };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(queryKey(context.targetSeasonId), context.previousPeople);
      }
      setDialogError(error instanceof Error ? error.message : messages.createFallback);
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingPerson(null);
      setDialogError(null);
    },
    onSettled: invalidateList,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PersonFormPayload }) =>
      updatePersonnel(apiEndpoint, id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKey(seasonId) });
      const previousPeople = queryClient.getQueryData<Person[]>(queryKey(seasonId)) ?? [];
      queryClient.setQueryData<Person[]>(queryKey(seasonId), (current) =>
        (current ?? []).map((person) =>
          person.id === id
            ? {
                ...person,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone,
              }
            : person
        )
      );
      return { previousPeople };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(queryKey(seasonId), context.previousPeople);
      }
      setDialogError(error instanceof Error ? error.message : messages.updateFallback);
    },
    onSuccess: () => {
      setDialogOpen(false);
      setEditingPerson(null);
      setDialogError(null);
    },
    onSettled: invalidateList,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePersonnel(apiEndpoint, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKey(seasonId) });
      const previousPeople = queryClient.getQueryData<Person[]>(queryKey(seasonId)) ?? [];
      queryClient.setQueryData<Person[]>(queryKey(seasonId), (current) =>
        (current ?? []).filter((person) => person.id !== id)
      );
      return { previousPeople };
    },
    onError: (_error, _id, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(queryKey(seasonId), context.previousPeople);
      }
    },
    onSuccess: () => setDeleteTarget(null),
    onSettled: invalidateList,
  });

  const resetDialogMutations = () => {
    createMutation.reset();
    updateMutation.reset();
  };

  const handleAddClick = () => {
    setEditingPerson(null);
    setDialogError(null);
    resetDialogMutations();
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogError(null);
    setEditingPerson(null);
    resetDialogMutations();
  };

  const handleDialogSubmit = (payload: PersonFormPayload) =>
    editingPerson ? updateMutation.mutate({ id: editingPerson.id, payload }) : createMutation.mutate(payload);

  const handleEditClick = (person: Person) => {
    setEditingPerson(person);
    setDialogError(null);
    resetDialogMutations();
    setDialogOpen(true);
  };

  const handleDeleteClick = (person: Person) => {
    deleteMutation.reset();
    setDeleteTarget(person);
  };

  const handleDeleteClose = () => {
    setDeleteTarget(null);
    deleteMutation.reset();
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return {
    people,
    loading,
    loadError: isError && queryError instanceof Error ? queryError.message : null,
    refetch: () => void refetch(),
    dialogOpen,
    dialogError,
    deleteTarget,
    isDeleteError: deleteMutation.isError,
    deleteError: deleteMutation.error,
    submitting: createMutation.isPending || updateMutation.isPending,
    isDeletePending: deleteMutation.isPending,
    deletingId: deleteMutation.isPending ? (deleteTarget?.id ?? null) : null,
    dialogTitle: editingPerson ? dialogTitles.edit : dialogTitles.add,
    submitLabel: editingPerson ? "Aktualizuj" : "Zapisz",
    initialValues: toInitialValues(editingPerson),
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleDeleteClose,
    handleDeleteConfirmed,
    handleDialogClose,
    handleDialogSubmit,
  };
}
