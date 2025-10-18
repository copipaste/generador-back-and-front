"use client";

import { useEffect, useState } from "react";
import type { ProjectConfig } from "~/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ProjectConfig) => void;
  initialConfig?: ProjectConfig;
};

const defaultConfig: ProjectConfig = {
  projectName: "mi-proyecto",
  description: "",
  groupId: "com.ejemplo.proyecto",
  artifactId: "mi-proyecto",
  version: "1.0.0",
  javaVersion: "17",
  springBootVersion: "3.2.0",
  packaging: "jar",
  database: "postgresql",
  databaseName: "mi_proyecto_db",
  databaseHost: "localhost",
  databasePort: 5432,
  databaseUsername: "postgres",
  databasePassword: "password",
  serverPort: 8080,
  contextPath: "/api",
  flutterEnabled: false,
  flutterVersion: "3.16.0",
  flutterPackageName: "com.ejemplo.proyecto_app",
};

const ProjectConfigModal = ({ isOpen, onClose, onSave, initialConfig }: Props) => {
  const [config, setConfig] = useState<ProjectConfig>(initialConfig ?? defaultConfig);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-lg bg-white shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-lg">
            <h2 id="modal-title" className="text-xl font-bold text-white">
              ⚙️ Configuración del Proyecto
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              Configura los parámetros para la generación de código Spring Boot y Flutter
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Información Básica */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.projectName}
                      onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                      placeholder="mi-proyecto-erp"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.description ?? ""}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="Sistema de gestión empresarial..."
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              {/* Configuración Java/Spring Boot */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                  Configuración Java/Spring Boot
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group ID *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.groupId}
                      onChange={(e) => setConfig({ ...config, groupId: e.target.value })}
                      placeholder="com.ejemplo.proyecto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Artifact ID *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.artifactId}
                      onChange={(e) => setConfig({ ...config, artifactId: e.target.value })}
                      placeholder="mi-proyecto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versión *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.version}
                      onChange={(e) => setConfig({ ...config, version: e.target.value })}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versión de Java *
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.javaVersion}
                      onChange={(e) => setConfig({ ...config, javaVersion: e.target.value })}
                    >
                      <option value="11">Java 11</option>
                      <option value="17">Java 17</option>
                      <option value="21">Java 21</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Versión de Spring Boot *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.springBootVersion}
                      onChange={(e) => setConfig({ ...config, springBootVersion: e.target.value })}
                      placeholder="3.2.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empaquetado *
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.packaging}
                      onChange={(e) => setConfig({ ...config, packaging: e.target.value as "jar" | "war" })}
                    >
                      <option value="jar">JAR</option>
                      <option value="war">WAR</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Base de Datos */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                  Base de Datos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Base de Datos *
                    </label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.database}
                      onChange={(e) => setConfig({ ...config, database: e.target.value as ProjectConfig["database"] })}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="h2">H2 (En memoria)</option>
                      <option value="oracle">Oracle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Base de Datos
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.databaseName ?? ""}
                      onChange={(e) => setConfig({ ...config, databaseName: e.target.value })}
                      placeholder="mi_proyecto_db"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.databaseHost ?? "localhost"}
                      onChange={(e) => setConfig({ ...config, databaseHost: e.target.value })}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.databasePort ?? 5432}
                      onChange={(e) => setConfig({ ...config, databasePort: parseInt(e.target.value) || 5432 })}
                      placeholder="5432"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.databaseUsername ?? ""}
                      onChange={(e) => setConfig({ ...config, databaseUsername: e.target.value })}
                      placeholder="postgres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.databasePassword ?? ""}
                      onChange={(e) => setConfig({ ...config, databasePassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </section>

              {/* Servidor */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                  Servidor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto del Servidor *
                    </label>
                    <input
                      type="number"
                      required
                      min="1024"
                      max="65535"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.serverPort}
                      onChange={(e) => setConfig({ ...config, serverPort: parseInt(e.target.value) })}
                      placeholder="8080"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Context Path
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      value={config.contextPath ?? ""}
                      onChange={(e) => setConfig({ ...config, contextPath: e.target.value })}
                      placeholder="/api"
                    />
                  </div>
                </div>
              </section>

              {/* Flutter (Opcional) */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2 flex items-center gap-2">
                  <span>Flutter (Opcional)</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.flutterEnabled}
                      onChange={(e) => setConfig({ ...config, flutterEnabled: e.target.checked })}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </h3>
                {config.flutterEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Versión de Flutter
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                        value={config.flutterVersion ?? ""}
                        onChange={(e) => setConfig({ ...config, flutterVersion: e.target.value })}
                        placeholder="3.16.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Paquete Flutter
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                        value={config.flutterPackageName ?? ""}
                        onChange={(e) => setConfig({ ...config, flutterPackageName: e.target.value })}
                        placeholder="com.ejemplo.proyecto_app"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition active:scale-95 shadow-md"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectConfigModal;
