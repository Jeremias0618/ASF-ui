<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="ASF-ui" width="96" height="96" />
</p>

<h1 align="center">ASF-ui</h1>

<p align="center">
  Fork of the official ArchiSteamFarm web UI, with <strong>pnpm</strong> and Yeremi customizations.
</p>

<p align="center">
  <a href="https://github.com/Jeremias0618/ASF-ui">
    <img src="https://img.shields.io/badge/repo-Jeremias0618%2FASF--ui-181717?style=flat&logo=github&logoColor=white" alt="Repository" />
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
    <img src="https://hits.sh/github.com/Jeremias0618/ASF-ui.svg?style=for-the-badge&label=Visitors&color=0e75b6" alt="Repository visitors" />
  </a>
</p>

---

[Español](README-ESP.md)

> [!IMPORTANT]
> Not the official JustArchiNET project. Apache-2.0 from upstream; support is the fork maintainer’s responsibility.

## Quick start

Requires Node.js **>= 20** and **pnpm** 11.5+ (`corepack enable`).

```bash
git clone https://github.com/Jeremias0618/ASF-ui.git
cd ASF-ui
git remote add upstream https://github.com/JustArchiNET/ASF-ui.git   # if missing

pnpm install
pnpm run dev      # or: pnpm serve / pnpm start → http://localhost:8080
pnpm run build    # → dist/
```

> [!NOTE]
> Use **pnpm** only (`pnpm-lock.yaml`). Dev proxy forwards `/api` to ASF at `http://localhost:1242` (run the ASF exe for live data).

**Deploy:** copy `dist/` into `<ASF_install>/www/`, then hard-reload `http://localhost:1242`. Official ASF auto-updates may overwrite `www/`.

**Sync upstream:** `git fetch upstream && git merge upstream/main` → drop any reintroduced `package-lock.json` → `pnpm install && pnpm run build`.

Related: [ASF-Plugin](https://github.com/Jeremias0618/ASF-Plugin) · [ArchiSteamFarm](https://github.com/JustArchiNET/ArchiSteamFarm)

## License and credits

- Upstream: [JustArchiNET/ASF-ui](https://github.com/JustArchiNET/ASF-ui) — Apache-2.0  
- Fork and Yeremi changes: [Jeremias0618/ASF-ui](https://github.com/Jeremias0618/ASF-ui)
