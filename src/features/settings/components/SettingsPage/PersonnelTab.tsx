import { Alert, Box, Button, CircularProgress, DialogContentText } from "@mui/material";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DataLoadAlert from "@/components/ui/DataLoadAlert";
import MutationErrorAlert from "@/components/ui/MutationErrorAlert";
import AddPersonDialog from "@/features/settings/components/SettingsPage/AddPersonDialog";
import PersonnelTable from "@/features/settings/components/SettingsPage/PersonnelTable";
import { usePersonnelTab } from "@/features/settings/components/SettingsPage/usePersonnelTab";
import type { PersonnelTabProps } from "@/features/settings/components/SettingsPage/types";

export default function PersonnelTab({ seasonId, config }: PersonnelTabProps) {
  const { title, noSeasonMessage, emptyMessage, emptyActionLabel, deleteDialogTitle, messages } = config;

  const {
    people,
    loading,
    loadError,
    refetch,
    dialogOpen,
    dialogError,
    deleteTarget,
    isDeleteError,
    deleteError,
    submitting,
    isDeletePending,
    deletingId,
    dialogTitle,
    submitLabel,
    initialValues,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleDeleteClose,
    handleDeleteConfirmed,
    handleDialogClose,
    handleDialogSubmit,
  } = usePersonnelTab(seasonId, config);

  if (!seasonId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {noSeasonMessage}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (loadError) {
    return <DataLoadAlert message={loadError} onRetry={refetch} />;
  }

  return (
    <>
      {isDeleteError ? (
        <Box sx={{ mb: 2 }}>
          <MutationErrorAlert error={deleteError} fallbackMessage={messages.deleteFallback} />
        </Box>
      ) : null}

      {people.length === 0 ? (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleAddClick}>
              {emptyActionLabel}
            </Button>
          }
        >
          {emptyMessage}
        </Alert>
      ) : null}

      <PersonnelTable
        title={title}
        data={people}
        onAddClick={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        deletingId={deletingId}
      />

      <AddPersonDialog
        open={dialogOpen}
        loading={submitting}
        error={dialogError}
        dialogTitle={dialogTitle}
        submitLabel={submitLabel}
        initialValues={initialValues}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirmed}
        loading={isDeletePending}
        title={deleteDialogTitle}
        description={
          <DialogContentText>
            Czy na pewno chcesz usunąć{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ? Operacja jest nieodwracalna.
          </DialogContentText>
        }
      />
    </>
  );
}
