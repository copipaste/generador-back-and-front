import { User } from "@prisma/client";
import { useState } from "react";
import { IoClose, IoCheckmarkCircle, IoPeople } from "react-icons/io5";
import { deleteInvitation, shareRoom } from "~/app/actions/rooms";
import UserAvatar from "./UserAvatar";

export default function ShareMenu({
  roomId,
  othersWithAccessToRoom,
}: {
  roomId: string;
  othersWithAccessToRoom: User[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const inviteUser = async () => {
    if (!isValidEmail(email)) {
      setError("Por favor ingrese un correo electrónico válido");
      return;
    }

    setLoading(true);
    setError(undefined);
    setSuccess(undefined);

    const errorMessage = await shareRoom(roomId, email);

    if (errorMessage) {
      setError(errorMessage);
    } else {
      setSuccess(`Invitación enviada a ${email}`);
      setEmail("");
      setTimeout(() => setSuccess(undefined), 3000);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && email && !loading) {
      inviteUser();
    }
  };

  const handleDeleteInvitation = async (userEmail: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el acceso de ${userEmail}?`)) {
      return;
    }

    setDeletingEmail(userEmail);
    await deleteInvitation(roomId, userEmail);
    setDeletingEmail(null);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
      >
        <IoPeople className="h-4 w-4" />
        Compartir
        {othersWithAccessToRoom.length > 0 && (
          <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold">
            {othersWithAccessToRoom.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <IoPeople className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-800">
                  Compartir este proyecto
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-gray-200 transition-colors duration-150"
              >
                <IoClose className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="space-y-4 px-6 py-5">
              {/* Formulario de invitación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitar por correo electrónico
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(undefined);
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-150"
                  />
                  <button
                    onClick={inviteUser}
                    disabled={loading || !email}
                    className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 ${
                      loading || !email
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-95"
                    }`}
                  >
                    {loading ? "Enviando..." : "Invitar"}
                  </button>
                </div>
              </div>

              {/* Mensajes de error y éxito */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 animate-in slide-in-from-top duration-300">
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 animate-in slide-in-from-top duration-300">
                  <IoCheckmarkCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              )}

              {/* Lista de usuarios */}
              {othersWithAccessToRoom.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span>Personas con acceso</span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                      {othersWithAccessToRoom.length}
                    </span>
                  </p>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {othersWithAccessToRoom.map((user, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.email ?? "Anónimo"} className="h-8 w-8" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{user.email}</span>
                            <span className="text-xs text-gray-500">Puede editar</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteInvitation(user.email)}
                          disabled={deletingEmail === user.email}
                          className={`rounded-full p-1.5 transition-all duration-150 ${
                            deletingEmail === user.email
                              ? "bg-gray-200 cursor-wait"
                              : "hover:bg-red-100 group"
                          }`}
                          title="Eliminar acceso"
                        >
                          <IoClose
                            className={`h-4 w-4 transition-colors duration-150 ${
                              deletingEmail === user.email
                                ? "text-gray-400"
                                : "text-gray-400 group-hover:text-red-600"
                            }`}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {othersWithAccessToRoom.length === 0 && (
                <div className="border-t pt-4">
                  <div className="text-center py-6">
                    <IoPeople className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Aún no has compartido este proyecto con nadie
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
