import { z, ZodIssueCode, type ZodErrorMap } from "zod";

const zodPlErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type: {
      if (issue.received === "undefined") return { message: "To pole jest wymagane" };
      return { message: "Nieprawidłowy typ wartości" };
    }
    case ZodIssueCode.invalid_literal:
      return { message: "Nieprawidłowa wartość" };
    case ZodIssueCode.unrecognized_keys:
      return { message: "Wykryto nieznane pola" };
    case ZodIssueCode.invalid_union:
      return { message: "Nieprawidłowa wartość" };
    case ZodIssueCode.invalid_union_discriminator:
      return { message: "Nieprawidłowa wartość" };
    case ZodIssueCode.invalid_enum_value:
      return { message: "Wybierz poprawną wartość" };
    case ZodIssueCode.invalid_arguments:
      return { message: "Nieprawidłowe argumenty" };
    case ZodIssueCode.invalid_return_type:
      return { message: "Nieprawidłowa wartość zwracana" };
    case ZodIssueCode.invalid_date:
      return { message: "Nieprawidłowa data" };
    case ZodIssueCode.invalid_string: {
      if (issue.validation === "email") return { message: "Nieprawidłowy adres email" };
      if (issue.validation === "url") return { message: "Nieprawidłowy adres URL" };
      return { message: "Nieprawidłowa wartość tekstowa" };
    }
    case ZodIssueCode.too_small: {
      if (issue.type === "string") return { message: `Wymagana minimalna liczba znaków: ${issue.minimum}` };
      if (issue.type === "number") return { message: `Minimalna wartość to ${issue.minimum}` };
      if (issue.type === "array") return { message: `Wymagana minimalna liczba elementów: ${issue.minimum}` };
      return { message: ctx.defaultError };
    }
    case ZodIssueCode.too_big: {
      if (issue.type === "string") return { message: `Maksymalna liczba znaków: ${issue.maximum}` };
      if (issue.type === "number") return { message: `Maksymalna wartość to ${issue.maximum}` };
      if (issue.type === "array") return { message: `Maksymalna liczba elementów: ${issue.maximum}` };
      return { message: ctx.defaultError };
    }
    case ZodIssueCode.custom:
      return { message: issue.message ?? "Nieprawidłowa wartość" };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(zodPlErrorMap);

export { z };

