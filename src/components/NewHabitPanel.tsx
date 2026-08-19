"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ApiRequestError, api } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import type { HabitDto } from "@/lib/types";

export function NewHabitPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  // O painel é escondido por CSS em vez de desmontado, então autoFocus nunca
  // dispararia de novo — o foco tem que ser pedido a cada abertura.
  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await api.post<{ habit: HabitDto }>("/habits", { name, category });
      setName("");
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : "Não deu para plantar agora");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="section-head" style={{ marginTop: 22 }}>
        <h2>&nbsp;</h2>
        <button className="add-btn" type="button" onClick={() => setOpen((v) => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo hábito
        </button>
      </div>

      <div className={`new-habit-panel ${open ? "open" : ""}`}>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim().length >= 2) save();
          }}
          placeholder="Nome do hábito (ex: Ler 10 páginas)"
          maxLength={80}
        />

        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Categoria</div>
          <div className="chip-select">
            {CATEGORIES.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip-opt ${category === option ? "selected" : ""}`}
                onClick={() => setCategory(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-actions">
          {error ? (
            <span className="form-error" role="alert">
              {error}
            </span>
          ) : null}
          <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={save}
            disabled={saving || name.trim().length < 2}
          >
            {saving ? "Plantando…" : "Plantar hábito"}
          </button>
        </div>
      </div>
    </>
  );
}
