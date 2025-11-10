"use client";

import { useState, useRef, cloneElement, isValidElement } from "react";
import useImageToErd from "./useImageToErd";

type Props = {
  trigger?: React.ReactNode;
};

export default function ImageToErdModal({ trigger }: Props) {
  const { fromImage } = useImageToErd();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpen = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    if (!loading) {
      dialogRef.current?.close();
      setFile(null);
      setPreview(null);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    if (!selectedFile.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida (PNG, JPEG, WebP, GIF)");
      return;
    }

    // Validar tamaño (4MB)
    const maxSize = 4 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(
        `La imagen es muy grande (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB). Máximo: 4MB`
      );
      return;
    }

    setError(null);
    setFile(selectedFile);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Por favor selecciona una imagen");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await fromImage(file, { replace: true });
      setFile(null);
      setPreview(null);
      handleClose();
    } catch (e: any) {
      setError(e?.message ?? "Error al procesar la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Simular cambio de input
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as any);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const triggerButton = isValidElement(trigger) ? (
    cloneElement(trigger as React.ReactElement, { onClick: handleOpen })
  ) : (
    <button
      type="button"
      onClick={handleOpen}
      className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 shadow"
      title="Subir imagen de diagrama"
    >
      📸 Subir Imagen
    </button>
  );

  return (
    <>
      {triggerButton}
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="w-full max-w-3xl rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Generar Diagrama desde Imagen
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Sube una foto o captura de tu diagrama UML/ER dibujado a mano o en pizarra
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              onClick={handleClose}
              disabled={loading}
              aria-label="Cerrar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Upload Area */}
          <div
            className={`relative mb-4 rounded-xl border-2 border-dashed p-8 transition-colors ${
              preview
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />

            {preview ? (
              // Preview de la imagen
              <div className="flex flex-col items-center">
                <div className="relative max-h-80 w-full overflow-hidden rounded-lg border-2 border-green-300 bg-white">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">{file?.name}</span>
                  <span className="text-gray-400">
                    ({(file!.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-700 hover:underline"
                  disabled={loading}
                >
                  Cambiar imagen
                </button>
              </div>
            ) : (
              // Upload prompt
              <div className="flex flex-col items-center text-center">
                <svg
                  className="mb-4 h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mb-2 text-base font-medium text-gray-700">
                  Arrastra y suelta una imagen aquí
                </p>
                <p className="mb-4 text-sm text-gray-500">o</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Seleccionar archivo
                </button>
                <p className="mt-4 text-xs text-gray-400">
                  Formatos soportados: PNG, JPEG, WebP, GIF • Máximo 4MB
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mb-4 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-900">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tips para mejores resultados:
            </h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  Asegúrate de que las entidades (cajas) tengan nombres claros y legibles
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Incluye atributos dentro de cada caja si es posible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  Marca las cardinalidades (1, *, 1..*, etc.) en las líneas de relación
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Usa buena iluminación y evita sombras sobre el diagrama</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>La imagen debe estar enfocada y sin demasiado ruido</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
              disabled={loading || !file}
            >
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              )}
              {loading ? "Procesando..." : "Generar Diagrama"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

