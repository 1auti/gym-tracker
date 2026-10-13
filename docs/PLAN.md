# Gym Tracker — Plan de Desarrollo

> Guía para Claude Code. Las decisiones en `SPEC DRIVEN DECISIONS` ya tomadas son **cerradas**: no re-evaluarlas ni proponer alternativas salvo que el dev lo pida explícitamente. Ante cualquier decisión de UX o arquitectura **no cubierta acá, preguntar antes de implementar**.

---

## 1. Objetivo

App móvil Android (APK debug para uso personal) para registrar y seguir la progresión de entrenamientos de gimnasio.

Principios rectores (en orden de prioridad):
1. **Velocidad de registro**: anotar una serie debe tomar segundos y la menor cantidad de toques posible. Es el caso de uso #1 y se hace con el teléfono en la mano entre series.
2. **100% offline**: sin backend, sin nube, sin permisos de red. Todo local en el dispositivo.
3. **Simplicidad**: MVP mínimo funcional primero. Nada de features especulativas.

---

## 2. Stack (DECIDIDO — no reabrir)

| Área | Elección | Motivo |
|---|---|---|
| Framework | Expo + React Native + TypeScript | Velocidad de desarrollo; entorno ya configurado y build funcionando en el dispositivo del dev (TCL 30 SE) |
| Persistencia | `expo-sqlite` (API async moderna: `openDatabaseAsync`, `runAsync`, `getAllAsync`) | Datos relacionales (sesión 1-N series) con agregaciones (progreso por ejercicio). El dev ya domina SQL. **No usar la API vieja de callbacks (`transaction()`), está deprecada** |
| Build | `npx expo run:android` (dev build local, APK debug) | Sin Play Store por ahora. `expo prebuild` ya ejecutado, carpeta `android/` generada |
| Estado | React state (`useState`/`useReducer`) + contexto solo si hace falta | Sin Redux/Zustand salvo que la complejidad lo justifique — y hay que justificarlo primero |
| Estructura | `db/` para acceso a datos, `screens/` para pantallas, `components/` para reutilizables | Separación por responsabilidad, sin capas extra |

Entorno del dev: EndeavourOS (Arch), fish shell, VS Code, SDK en `/opt/android-sdk`, dispositivo físico por USB (sin emulador — notebook de 2 núcleos).

---

## 3. Modelo de datos

Ya existe `db/database.ts` con `initDatabase()` / `getDatabase()` (singleton, `PRAGMA foreign_keys = ON`, schema idempotente con `IF NOT EXISTS`). **Extender ese archivo**, no reemplazar el patrón.

Schema actualizado (incorpora RPE/RIR y plantillas):

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL              -- ISO 8601 'YYYY-MM-DD'
);

CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion_id INTEGER NOT NULL,
  ejercicio TEXT NOT NULL,         -- texto libre en v1 (ver decisión 2026-07-11 #2)
  peso REAL NOT NULL,
  repeticiones INTEGER NOT NULL,
  rpe REAL,                        -- opcional, escala 1-10 (admite .5)
  rir INTEGER,                     -- opcional, reps in reserve
  orden INTEGER NOT NULL,          -- orden de ejecución dentro de la sesión
  FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plantillas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plantilla_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plantilla_id INTEGER NOT NULL,
  ejercicio TEXT NOT NULL,
  peso REAL,                       -- valores sugeridos, ajustables al cargar
  repeticiones INTEGER,
  rpe REAL,
  rir INTEGER,
  orden INTEGER NOT NULL,
  FOREIGN KEY (plantilla_id) REFERENCES plantillas(id) ON DELETE CASCADE
);
```

Nota: RPE y RIR son **opcionales** (NULL permitido). Obligar a cargarlos en cada serie va contra el principio #1 (velocidad). El flujo rápido es ejercicio + peso + reps; RPE/RIR se completan si el usuario quiere.

---

## 4. Funcionalidades del MVP (en orden de implementación)

### 4.1 Registro rápido de series ✦ prioridad máxima
- [x] Pantalla "Sesión activa": crear sesión de hoy con un toque si no existe
- [x] Agregar serie: ejercicio (con autocompletado sobre ejercicios ya usados — `SELECT DISTINCT ejercicio`), peso, reps; RPE/RIR opcionales colapsados
- [x] Botones +/- para peso (pasos de 2.5) y reps (pasos de 1) — minimizar teclado
- [x] "Repetir última serie" con un toque (duplica la anterior, el caso más común entre series)
- [x] Feedback visual inmediato al guardar (la serie aparece en la lista de la sesión)

### 4.2 Plantillas de sesión
- [x] CRUD de plantillas (nombre + lista de ejercicios con valores sugeridos)
- [x] "Iniciar sesión desde plantilla": crea la sesión y precarga los ejercicios como guía; cada serie real se registra ajustando sobre lo sugerido
- [x] Editable en cualquier momento

### 4.3 Historial y progreso
- [x] Lista de sesiones pasadas (fecha + resumen: cantidad de ejercicios/series)
- [x] Detalle de sesión: sus series en orden
- [x] Vista por ejercicio: últimas N series de ese ejercicio a través de sesiones (peso, reps, RPE/RIR) — una query con `WHERE ejercicio = ? ORDER BY fecha DESC`
- [x] Sin gráficos en el MVP (ver decisión 2026-07-11 #4)

### 4.4 Navegación
- [x] Tres accesos: **Entrenar** (default al abrir la app), **Plantillas**, **Historial**
- [x] La app abre directo en la acción principal: registrar

---

## 5. Restricciones obligatorias

- **Cero red**: ninguna librería de analytics, ads, sync, crash reporting remoto ni nada que requiera `INTERNET` permission más allá de lo que Expo necesita para el dev server en modo desarrollo.
- **Escrituras/lecturas percibidas como instantáneas**: SQLite local lo garantiza; no agregar capas intermedias que sumen latencia.
- **Sin código muerto ni features especulativas**: solo lo listado en el MVP. Si una abstracción parece útil "para el futuro", preguntar primero.
- **Comentarios con intención**: comentar el qué y el por qué de bloques importantes, no lo obvio.
- Exportación/backup manual de datos: **fuera del MVP**, evaluar después.

---

## SPEC DRIVEN DECISIONS

> Registrar acá toda decisión de diseño/arquitectura con fecha, motivo y, si hubo consulta al dev, la respuesta. Claude Code debe agregar entradas nuevas cada vez que tome o consulte una decisión.

### 2026-07-11 — #1 Stack: Expo + React Native + TypeScript
- Decisión: RN con Expo (dev build, no Expo Go), TypeScript.
- Motivo: prioridad de shippear rápido declarada por el dev; entorno ya configurado y validado con build exitoso en dispositivo físico.
- Estado: CERRADA.

### 2026-07-11 — #2 Persistencia: SQLite directo (expo-sqlite), sin ORM ni NoSQL
- Decisión: `expo-sqlite` con SQL crudo. Se evaluaron y descartaron WatermelonDB (sobreingeniería para el caso) y Realm/NoSQL (los datos son relacionales con agregaciones; SQL gana).
- Motivo: forma relacional de los datos (sesión 1-N series), necesidad de agregaciones, y dominio previo de SQL del dev.
- Estado: CERRADA.

### 2026-07-11 — #3 `ejercicio` como texto libre, sin tabla normalizada
- Decisión: no crear tabla `ejercicios` en v1; autocompletado vía `SELECT DISTINCT`.
- Motivo: KISS — normalizar antes de necesitarlo es sobreingeniería. Se migra cuando haga falta metadata por ejercicio (grupo muscular, etc.).
- Estado: CERRADA para el MVP. Revisar si el autocompletado por DISTINCT resulta insuficiente.

### 2026-07-11 — #4 Sin gráficos de progreso en el MVP
- Decisión: el progreso se muestra como lista de series históricas por ejercicio, sin librería de charts.
- Motivo: una librería de gráficos suma peso y complejidad; la lista ya responde "¿cuánto levanté la última vez?", que es la pregunta real durante el entreno.
- Estado: CERRADA para el MVP. Candidata a v2.

### 2026-07-11 — #5 RPE/RIR opcionales
- Decisión: campos NULL-ables, colapsados en la UI de registro rápido.
- Motivo: obligarlos en cada serie contradice la prioridad #1 (registro en segundos).
- Consulta al dev: ¿confirmás que RPE/RIR deben ser opcionales y no obligatorios?
- Respuesta dev: implementado y en uso sin objeciones; se toma como confirmado.
- Estado: CERRADA.

### 2026-07-11 — #6 MVP implementado en `master`
- Decisión: las 4 funcionalidades del MVP (registro rápido, plantillas, historial/progreso, navegación) están implementadas y mergeadas como rama principal (`master`, ex-`main`).
- Motivo: dejar registro de que el checklist de la sección 4 refleja el estado real del código, no solo la intención.
- Estado: CERRADA. Pendiente de validación manual en dispositivo físico (`npx expo run:android`), no ejecutable desde este entorno.

### Plantilla para nuevas entradas
```
### AAAA-MM-DD — #N Título corto
- Decisión:
- Motivo:
- Consulta al dev (si aplica):
- Respuesta dev:
- Estado: ABIERTA | CERRADA
```
