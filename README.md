# Agendify — Frontend

Aplicacion web para la gestion de turnos online, orientada a negocios como barbershops, peluquerias, spas y salones de belleza. Permite a los clientes buscar negocios y reservar turnos de forma rapida, y a los comercios gestionar su agenda.

Proyecto de la materia **Proyectos de Software** — UNSAM.

---

## Stack tecnologico

- **React 19** con TypeScript
- **Vite** (bundler, con plugin SWC)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router v7**
- **Axios**
- **Vitest** + Testing Library (unit/integration tests)

---

## Estructura del proyecto

```
src/
  pages/          # Vistas principales (LandingPage, Login, Registro, etc.)
  components/     # Componentes reutilizables por pagina
  layouts/        # Layouts compartidos (AppLayout)
  routes/         # Configuracion de rutas y guards de acceso
  services/       # Llamadas a la API
  customHooks/    # Hooks personalizados
  types/          # Tipos e interfaces TypeScript
  utils/          # Utilitarios generales
  lib/            # Helpers internos (ej: manejo de sesion)
```

---

## Instalacion y uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Build de produccion
npm run build
```

---

## Equipo

- Gonzalo Damian Lopez
- Johnatan Gomez Ciranna
- Nahuel Garcia
- Rodrigo Casco
- Santiago Zolla
