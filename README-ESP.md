<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="ASF-ui" width="96" height="96" />
</p>

<h1 align="center">ASF-ui</h1>

<p align="center">
  Fork de la interfaz web oficial de ArchiSteamFarm, con gestor <strong>pnpm</strong> y mejoras Yeremi.
</p>

<p align="center">
  <a href="https://github.com/Jeremias0618/ASF-ui">
    <img src="https://img.shields.io/badge/repo-Jeremias0618%2FASF--ui-181717?style=flat&logo=github&logoColor=white" alt="Repositorio" />
  </a>
  <a href="https://github.com/JustArchiNET/ASF-ui">
    <img src="https://img.shields.io/badge/upstream-JustArchiNET%2FASF--ui-2ea44f?style=flat&logo=github&logoColor=white" alt="Upstream" />
  </a>
  <img src="https://img.shields.io/badge/Vue-2.7-4FC08D?style=flat&logo=vuedotjs&logoColor=white" alt="Vue" />
  <img src="https://img.shields.io/badge/pnpm-11.5-F69220?style=flat&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/webpack-5-8DD6F9?style=flat&logo=webpack&logoColor=black" alt="webpack" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat" alt="License" />
</p>

<p align="center">
  <a href="https://hits.sh/github.com/Jeremias0618/ASF-ui/">
    <img src="https://hits.sh/github.com/Jeremias0618/ASF-ui.svg?style=for-the-badge&label=Visitors&color=0e75b6" alt="Visitas al repositorio" />
  </a>
</p>

---

[English](README.md)

> [!IMPORTANT]
> **No** es el proyecto oficial de JustArchiNET. Licencia Apache-2.0 del upstream. Soporte: responsabilidad del mantenedor del fork.

## Inicio rápido

Requiere Node.js **>= 20** y **pnpm** 11.5+ (`corepack enable`).

```bash
git clone https://github.com/Jeremias0618/ASF-ui.git
cd ASF-ui
git remote add upstream https://github.com/JustArchiNET/ASF-ui.git   # si falta

pnpm install
pnpm run dev      # o: pnpm serve / pnpm start → http://localhost:8080
pnpm run build    # → dist/
```

> [!NOTE]
> Solo **pnpm** (`pnpm-lock.yaml`). En desarrollo, el proxy envía `/api` a ASF en `http://localhost:1242` (necesitas el exe para datos reales).

**Deploy:** copia `dist/` a `<instalación_ASF>/www/` y recarga forzada en `http://localhost:1242`. Un auto-update del ASF oficial puede pisar `www/`.

**Sync upstream:** `git fetch upstream && git merge upstream/main` → descarta `package-lock.json` si reaparece → `pnpm install && pnpm run build`.

Relacionado: [ASF-Plugin](https://github.com/Jeremias0618/ASF-Plugin) · [ArchiSteamFarm](https://github.com/JustArchiNET/ArchiSteamFarm)

## Licencia y créditos

- Upstream: [JustArchiNET/ASF-ui](https://github.com/JustArchiNET/ASF-ui) — Apache-2.0  
- Fork y cambios Yeremi: [Jeremias0618/ASF-ui](https://github.com/Jeremias0618/ASF-ui)
