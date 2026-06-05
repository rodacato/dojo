# WIP — Sprint 014 (alternativa descartada): iframe Sandbox + Segundo Curso

> Este archivo era una propuesta alternativa para Sprint 014 que fue supersedida por el Courses MVP (TypeScript Fundamentals con Piston). Se restaura para evaluación del panel antes de decidir si incluirlo en Sprint 015 o descartarlo definitivamente.

---

## Propuesta principal: iframe Sandbox para cursos frontend

### El problema

Piston es ideal para lenguajes compilados/interpretados (TypeScript, Python, Go, Ruby). Pero para HTML, CSS, JavaScript vanilla, React, y Vue — Piston es una mala elección:
- No tiene contexto de DOM
- No puede renderizar nada visual
- Las pruebas de comportamiento visual son imposibles

### La alternativa: ejecución en el browser

Los navegadores ya son sandboxes. Un `<iframe sandbox>` con atributos controlados puede:
- Ejecutar JavaScript/HTML/CSS sin costo de servidor
- Renderizar output visual en tiempo real
- Ser destruido/recreado por cada ejecución — aislamiento garantizado

### Propuesta de implementación

```
StepEditor (ejercicio frontend)
  └── IframeSandboxRunner
        ├── construye un HTML document con el código del usuario
        ├── inyecta un mini test runner via postMessage
        ├── escucha resultados via window.addEventListener('message')
        └── retorna TestResult[] — mismo contrato que Piston
```

**Atributos de seguridad del iframe:**
```html
<iframe
  sandbox="allow-scripts"
  srcdoc="..."   <!-- evita navegación -->
/>
```

No se necesita `allow-same-origin` — sin eso el iframe no puede acceder al DOM padre.

### Tipos de ejercicios que habilita

- **JavaScript puro** — manipulación de arrays, funciones, algoritmos (ya funciona con Piston pero el runner es más simple sin compilar)
- **DOM manipulation** — `querySelector`, eventos, modificación de elementos
- **CSS layout** — Flexbox, Grid, responsive (verificación visual o via getComputedStyle)
- **React básico** — con CDN import, sin bundler
- **Vue básico** — con CDN import, sin bundler

### Ventajas vs Piston

| Criterio | Piston | iframe Sandbox |
|---|---|---|
| Costo servidor | CPU + memoria | $0 |
| Latencia | ~280ms (TypeScript) | <10ms |
| Lenguajes soportados | TS/JS/Py/Go/Ruby/SQL | HTML/CSS/JS/React/Vue |
| Output visual | No | Sí |
| Contexto DOM | No | Sí |
| Sandboxing | Proceso aislado | iframe sandbox |
| Complejidad implementación | Ya hecho | ~2-3 días |

---

## Propuesta secundaria: Segundo curso

Para validar que el modelo de cursos escala, añadir un segundo curso durante el mismo sprint:

**Candidatos:**
- "JavaScript DOM Fundamentals" — usa el iframe sandbox
- "Python for Data" — usa Piston (sin trabajo nuevo en infra)
- "SQL Basics" — usa Piston (SQL ya soportado)

---

## Riesgos identificados

1. **Seguridad**: `allow-scripts` sin `allow-same-origin` mitiga la mayoría, pero código malicioso puede hacer requests a terceros desde el iframe
2. **Testing CSS/visual**: difícil de hacer determinista — `getComputedStyle` puede variar por browser
3. **React/Vue sin bundler**: limitado a CDN, no soporta módulos ES nativos complejos
4. **Complejidad del test runner**: cada tipo de ejercicio necesita un runner diferente (JS puro vs DOM vs React)
