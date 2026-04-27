import { z } from "zod";

const zodPlErrorMap = (issue: any, ctx: any) => {
  if (issue?.code === "invalid_type" && issue?.received === "undefined") return { message: "To pole jest wymagane" };
  if (issue?.code === "invalid_string") {
    if (issue?.validation === "email") return { message: "Nieprawidłowy adres e-mail" };
    if (issue?.validation === "url") return { message: "Nieprawidłowy adres URL" };
  }
  if (issue?.code === "too_small") {
    if (issue?.type === "string") return { message: `Wymagana minimalna liczba znaków: ${issue.minimum}` };
    if (issue?.type === "number") return { message: `Minimalna wartość to ${issue.minimum}` };
    if (issue?.type === "array") return { message: `Wymagana minimalna liczba elementów: ${issue.minimum}` };
  }
  if (issue?.code === "too_big") {
    if (issue?.type === "string") return { message: `Maksymalna liczba znaków: ${issue.maximum}` };
    if (issue?.type === "number") return { message: `Maksymalna wartość to ${issue.maximum}` };
    if (issue?.type === "array") return { message: `Maksymalna liczba elementów: ${issue.maximum}` };
  }
  if (issue?.code === "custom" && issue?.message) return { message: issue.message };
  return { message: ctx?.defaultError ?? "Nieprawidłowa wartość" };
};

z.setErrorMap(zodPlErrorMap as any);

export { z };

