# ASF-ui (fork Yeremi)

Fork de [JustArchiNET/ASF-ui](https://github.com/JustArchiNET/ASF-ui) con mejoras propias.

> [!IMPORTANT]
> No es el proyecto oficial de JustArchiNET. Licencia Apache-2.0 del upstream.

## Gestor de paquetes

Este fork usa **pnpm** (no npm).

```bash
pnpm install
pnpm run build
pnpm run serve
pnpm run lint
```

Requisito: Node >= 20 y pnpm 11.5+ (`packageManager` en `package.json`).

## Deploy a ASF

Tras `pnpm run build`, copiar el contenido de `dist/` a la carpeta `www/` de tu instalación de ArchiSteamFarm.
