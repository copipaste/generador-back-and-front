"use client";

import { useState, useRef, useEffect, cloneElement, isValidElement } from "react";
import useNlToErd from "./useNlToErd"; // ✅ default import

// --- Constantes y Tipos ---
type Props = {
  trigger?: React.ReactNode;
  defaultValue?: string;
};

const SAMPLES = [
  "Una Persona tiene muchas Casas y cada Casa pertenece a un Condominio",
  "Un Autor escribe muchos Libros; cada Libro tiene una Editorial",
  "Un Curso tiene muchos Estudiantes (N–N) mediante Inscripcion",
];

// --- Componente Principal ---
export default function NlToErdModal({ trigger, defaultValue = "" }: Props) {
  // ✅ el hook devuelve un objeto con métodos
  const { fromDescription /*, clearCanvas */ } = useNlToErd();

  const [text, setText] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Usamos una ref para el <dialog> nativo.
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 2. Efectos más limpios para abrir/cerrar el modal.
  const handleOpen = () => dialogRef.current?.showModal();
  const handleClose = () => dialogRef.current?.close();

  // 3. Enfocar el textarea cuando se abre el diálogo.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const observer = new MutationObserver(() => {
      if (dialog.hasAttribute("open")) {
        textareaRef.current?.focus();
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Escribe una descripción para generar el diagrama.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // ✅ usamos el método del hook y reemplazamos el lienzo
      await fromDescription(text.trim(), { replace: true });
      setText("");
      handleClose(); // Cierra el modal al tener éxito
    } catch (e: any) {
      setError(e?.message ?? "Ocurrió un error al generar el diagrama.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Mejor manejo del 'trigger' con cloneElement para más flexibilidad.
  const triggerButton = isValidElement(trigger) ? (
    cloneElement(trigger as React.ReactElement, { onClick: handleOpen })
  ) : (
    <button
      type="button"
      onClick={handleOpen}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow"
      title="Describe y te dibujo (NL → ERD)"
    >
      ✨ Describe y te dibujo
    </button>
  );

  return (
    <>
      {triggerButton}
      <dialog
        ref={dialogRef}
        onClose={() => !loading && handleClose()}
        className="w-full max-w-2xl rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/50"
      >
        <ModalContent
          text={text}
          setText={setText}
          loading={loading}
          error={error}
          textareaRef={textareaRef}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      </dialog>
    </>
  );
}

// --- Sub-componentes para mejorar la legibilidad ---
type ModalContentProps = {
  text: string;
  setText: (text: string) => void;
  loading: boolean;
  error: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onClose: () => void;
  onSubmit: () => void;
};

function ModalContent({
  text,
  setText,
  loading,
  error,
  textareaRef,
  onClose,
  onSubmit,
}: ModalContentProps) {
  return (
    <div className="p-5">
      {/* Encabezado */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Describe tu diagrama (NL → ERD)</h2>
          <p className="mt-1 text-xs text-gray-500">
            Escribe relaciones y cardinalidades. Ej: “Una Persona tiene muchas Casas…”
          </p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Sugerencias */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText(s)}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
            title="Usar ejemplo"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="mb-2">
        <textarea
          ref={textareaRef}
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSubmit();
          }}
          placeholder="Ej: Una Persona tiene muchas Casas y cada Casa pertenece a un Condominio"
          className="w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          disabled={loading}
        />
        <div className="mt-1 text-xs text-gray-400">
          {text.length} caracteres • <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> para generar
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={loading || !text.trim()}
        >
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
          )}
          Generar
        </button>
      </div>
    </div>
  );
}
