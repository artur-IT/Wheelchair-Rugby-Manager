import { useState } from "react";

interface RowWithId {
  id: string;
}

type RowUpdater<T extends RowWithId> = (row: T) => T;

export function useEditableRows<T extends RowWithId>(initialRows: T[] = []) {
  const [rows, setRows] = useState<T[]>(initialRows);

  const addRow = (newRow: T) => setRows((prevRows) => [...prevRows, newRow]);

  const removeRow = (id: string) => setRows((prevRows) => prevRows.filter((row) => row.id !== id));

  const updateRow = (id: string, updater: RowUpdater<T>) =>
    setRows((prevRows) => prevRows.map((row) => (row.id === id ? updater(row) : row)));

  return {
    rows,
    setRows,
    addRow,
    removeRow,
    updateRow,
  };
}
