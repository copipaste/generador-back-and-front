"use server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import UserMenu from "~/components/dashboard/UserMenu";
import CreateRoom from "~/components/dashboard/CreateRoom";
import RoomsView from "~/components/dashboard/RoomsView";

export default async function Page() {
  const session = await auth();

  const user = await db.user.findUniqueOrThrow({
    where: {
      id: session?.user.id,
    },
    include: {
      ownedRooms: true,
      roomInvites: {
        include: {
          room: true,
        },
      },
    },
  });

return (
  <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
    {/* Toggle para colapsar/expandir el sidebar */}
    <input id="sidebar-toggle" type="checkbox" className="peer hidden" />

    {/* SIDEBAR */}
    <aside
      className={`
        hidden md:flex flex-col
        bg-white/90 backdrop-blur
        border-r border-slate-200
        shadow-[0_4px_24px_-8px_rgba(2,6,23,0.15)]
        py-4 transition-[width] duration-300 ease-in-out
        w-20 peer-checked:w-64
      `}
    >
      {/* Logo / Marca */}
      <div className="px-3 mb-3">
        <div className="h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500
                        text-white font-semibold flex items-center justify-center shadow-sm">
          <span className="text-lg">F</span>
        </div>
      </div>

      {/* Separador */}
      <div className="mx-3 my-2 h-px bg-slate-200/70 rounded" />

      {/* Navegación */}
      <nav className="mt-1 px-2 space-y-1 text-slate-600 w-full">
        {/* Botón hamburguesa */}
        <label
          htmlFor="sidebar-toggle"
          title="Colapsar/Expandir"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer
                     hover:bg-slate-100 hover:text-sky-600 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md
                          group-hover:bg-white group-hover:shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </div>
          <span className="hidden peer-checked:block text-sm font-medium tracking-wide">
            Menú
          </span>
        </label>

        {/* Ejemplo de ítems extra (opcional) */}
        <button
          title="Dashboard"
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2
                     hover:bg-slate-100 hover:text-sky-600 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md group-hover:bg-white group-hover:shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12l9-9 9 9M4 10v10h16V10" />
            </svg>
          </div>
          <span className="hidden peer-checked:block text-sm font-medium tracking-wide">
            Inicio
          </span>
        </button>
      </nav>

      {/* Empuja hacia abajo el área de usuario */}
      <div className="mt-auto" />

      {/* Separador */}
      <div className="mx-3 my-2 h-px bg-slate-200/70 rounded" />

      {/* Usuario (pie del sidebar) */}
      <div className="px-3 pb-2 w-full">
        {/* Vista expandida: tarjeta suave */}
        <div className="hidden peer-checked:flex items-center gap-3 rounded-xl border border-slate-200
                        bg-white shadow-sm px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-sky-500/90 text-white flex items-center justify-center font-semibold">
            {String(user.email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">{user.email}</div>
            <div className="text-xs text-slate-500">Conectado</div>
          </div>
        </div>

        {/* Vista colapsada: solo icono centrado */}
        <div className="peer-checked:hidden flex justify-center">
          <div className="h-9 w-9 rounded-full bg-sky-500/90 text-white flex items-center justify-center font-semibold shadow-sm">
            {String(user.email?.[0] ?? "U").toUpperCase()}
          </div>
        </div>
      </div>
    </aside>

    {/* CONTENIDO PRINCIPAL */}
    <main className="flex flex-1 flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between h-16
                   bg-white/90 backdrop-blur border-b border-slate-200
                   px-4 sm:px-6 shadow-[0_4px_24px_-10px_rgba(2,6,23,0.12)]"
      >
        <div className="flex items-center gap-2">
          {/* Toggle para móviles */}
          <label
            htmlFor="sidebar-toggle"
            className="md:hidden flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg
                       hover:bg-slate-100 transition-colors"
            aria-label="Alternar sidebar"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </label>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Proyectos</h1>
        </div>

        {/* UserMenu del header (con borde suave) */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-2 py-1">
          <UserMenu email={user.email} />
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Tarjeta de acción principal */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
            <CreateRoom />
          </div>

          {/* Listado */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6
                          hover:shadow-md transition-shadow">
            <RoomsView
              ownedRooms={user.ownedRooms}
              roomInvites={user.roomInvites.map((x) => x.room)}
            />
          </div>
        </div>
      </section>
    </main>
  </div>
);


}

























































// "use server";

// import { auth } from "~/server/auth";
// import { db } from "~/server/db";
// import UserMenu from "~/components/dashboard/UserMenu";
// import CreateRoom from "~/components/dashboard/CreateRoom";
// import RoomsView from "~/components/dashboard/RoomsView";

// export default async function Page() {
//   const session = await auth();

//   const user = await db.user.findUniqueOrThrow({
//     where: {
//       id: session?.user.id,
//     },
//     include: {
//       ownedRooms: true,
//       roomInvites: {
//         include: {
//           room: true,
//         },
//       },
//     },
//   });

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <aside className="hidden md:flex w-20 flex-col items-center bg-white border-r border-gray-200 shadow-sm py-4">
//         <div className="mb-4">
//           {/* Puedes usar un logo o ícono aquí */}
//           <div className="h-10 w-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
//             F
//           </div>
//         </div>
//         <nav className="space-y-6 mt-8 text-gray-500">
//           <button className="hover:text-sky-500 transition-colors">
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//               <path d="M3 12h18M3 6h18M3 18h18" />
//             </svg>
//           </button>
//           {/* Otros iconos de navegación aquí */}
//         </nav>
//         <div className="mt-auto mb-4">
//           <UserMenu email={user.email} />
//         </div>
//       </aside>

//       {/* Main content */}
//       <main className="flex flex-1 flex-col">
//         {/* Header */}
//         <header className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-6 shadow-sm">
//           <h1 className="text-xl font-semibold text-gray-800">Proyectos</h1>
//           <UserMenu email={user.email} />
//         </header>

//         {/* Content */}
//         <section className="flex-1 overflow-y-auto p-6 bg-gray-50">
//           <div className="max-w-4xl mx-auto space-y-6">
//             <div>
//               <CreateRoom />
//             </div>
//             <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
//               <RoomsView
//                 ownedRooms={user.ownedRooms}
//                 roomInvites={user.roomInvites.map((x) => x.room)}
//               />
//             </div>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// }
