<p align="center">
  <img src="https://cdn.simpleicons.org/steam/1B2838" alt="ASF-ui" width="96" height="96" />
</p>

<h1 align="center">ASF-ui</h1>

<p align="center">
  Interfaz web personalizada de <strong>ArchiSteamFarm</strong> (bot social, multi-action y cambios).<br/>
  Fork de la UI oficial — no es un fork del núcleo de ASF.
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>Español</strong>
</p>

<p align="center">
  <a href="https://github.com/Jeremias0618/ASF-ui">
    <img src="https://img.shields.io/badge/repo-Jeremias0618%2FASF--ui-181717?style=flat&logo=github&logoColor=white" alt="Repositorio" />
  </a>
  <a href="https://github.com/JustArchiNET/ASF-ui">
    <img src="https://img.shields.io/badge/upstream-JustArchiNET%2FASF--ui-2ea44f?style=flat&logo=github&logoColor=white" alt="Upstream" />
  </a>
  <img src="https://img.shields.io/badge/Vue-2.7-4FC08D?style=flat&logo=vuedotjs&logoColor=white" alt="Vue" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat" alt="License" />
  <a href="https://github.com/Jeremias0618/ASF-ui/releases">
    <img src="https://img.shields.io/github/downloads/Jeremias0618/ASF-ui/total?style=flat&label=descargas" alt="Descargas de GitHub Releases" />
  </a>
</p>

<p align="center">
  <a href="https://hits.sh/github.com/Jeremias0618/ASF-ui/">
    <img src="https://hits.sh/github.com/Jeremias0618/ASF-ui.svg?style=flat-square&label=visitors&color=0e75b6" alt="Visitas al repositorio" />
  </a>
</p>

---

> [!IMPORTANT]
> Esto **no** es el proyecto oficial [JustArchiNET/ASF-ui](https://github.com/JustArchiNET/ASF-ui). Licencia Apache-2.0 del upstream. El soporte es responsabilidad del mantenedor del fork.

> [!IMPORTANT]
> Bot Social (amigos, comunidad, juegos, wishlist, transferencia de inventario) requiere el plugin **[ASFBotSocial](https://github.com/Jeremias0618/ASF-Plugin)**. La UI de stock de ASF (`www/`) no incluye esas pantallas.

## Vista previa

<table>
  <tr>
    <td align="center"><img src=".github/previews/Screenshot_1.png" alt="Dashboard" /><br/>Dashboard</td>
    <td align="center"><img src=".github/previews/Screenshot_2.png" alt="Inventario" /><br/>Inventario</td>
  </tr>
  <tr>
    <td align="center"><img src=".github/previews/Screenshot_5.png" alt="Logros" /><br/>Logros</td>
    <td align="center"><img src=".github/previews/Screenshot_6.png" alt="Idle" /><br/>Idle</td>
  </tr>
</table>

## Instalación (release compilado)

Los usuarios **no** necesitan Node.js. Descarga el paquete `www` ya compilado desde [GitHub Releases](https://github.com/Jeremias0618/ASF-ui/releases) (`ASF-ui.zip`).

1. Detén ArchiSteamFarm (o cierra la pestaña de la UI).
2. Descarga **ASF-ui.zip** del último release.
3. Extrae el ZIP en la carpeta **`www/`** de ASF (junto a `ArchiSteamFarm.exe`), reemplazando los archivos existentes.
4. Arranca ASF y abre `http://localhost:1242` (recarga forzada una vez).

> [!WARNING]
> Una actualización oficial de ASF puede pisar `www/`. Tras actualizar ASF, vuelve a extraer esta UI (o desactiva el auto-update de la UI si mantienes un `www/` personalizado).

### CLI

Detén ASF primero. Sustituye `RUTA_DE_TU_ARCHISTEAMFARM` por la carpeta que contiene `ArchiSteamFarm.exe` y `www/`, y desde ahí descarga y extrae.

> [!NOTE]
> En PowerShell de Windows **no** uses `curl` ni `unzip` (son de Linux; `curl` ahí es un alias de `Invoke-WebRequest`). Copia el bloque **Windows**.

**Windows (PowerShell)**

```powershell
cd "RUTA_DE_TU_ARCHISTEAMFARM"

curl.exe -L -o ASF-ui.zip "https://github.com/Jeremias0618/ASF-ui/releases/latest/download/ASF-ui.zip"
Expand-Archive -Path "ASF-ui.zip" -DestinationPath "www" -Force
Remove-Item "ASF-ui.zip"
```

**Linux / macOS**

```bash
cd "RUTA_DE_TU_ARCHISTEAMFARM"

curl -L -o ASF-ui.zip "https://github.com/Jeremias0618/ASF-ui/releases/latest/download/ASF-ui.zip"
unzip -o ASF-ui.zip -d www
rm ASF-ui.zip
```

Inicia ASF y abre `http://localhost:1242`.

## Relacionado

| Pieza | Repo |
|-------|------|
| Plugin (obligatorio para Bot Social) | https://github.com/Jeremias0618/ASF-Plugin |
| Núcleo ASF | https://github.com/JustArchiNET/ArchiSteamFarm |
| UI upstream | https://github.com/JustArchiNET/ASF-ui |

## Licencia y créditos

- Upstream: [JustArchiNET/ASF-ui](https://github.com/JustArchiNET/ASF-ui) — Apache-2.0
- Fork y cambios Yeremi: [Jeremias0618/ASF-ui](https://github.com/Jeremias0618/ASF-ui)
