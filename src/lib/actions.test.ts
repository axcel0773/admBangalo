import { describe, expect, it } from "vitest";

import { attempt } from "./actions";
import { MutationError } from "./supabase/errors";

describe("attempt", () => {
  it("devolve sucesso quando a tarefa termina", async () => {
    expect(await attempt(async () => {}, "Removido.")).toEqual({ status: "success", message: "Removido." });
  });

  it("transforma MutationError em mensagem para a tela", async () => {
    const state = await attempt(async () => {
      throw new MutationError("Não pode.");
    });
    expect(state).toEqual({ status: "error", message: "Não pode." });
  });

  it("deixa outros erros subirem (redirect, falhas inesperadas)", async () => {
    let caught: unknown = null;
    try {
      await attempt(async () => {
        throw new Error("boom");
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
  });
});
