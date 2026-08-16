import { PLUGIN_ZIP } from './constants';
import { isWindowsHomePath } from './asf-home-path';

export const PLUGIN_ZIP_URL = `https://github.com/Jeremias0618/ASF-Plugin/releases/latest/download/${PLUGIN_ZIP}`;

export const FALLBACK_HOME_PATH = 'RUTA_DE_TU_ARCHISTEAMFARM';

export function buildPluginInstallCommands(homePath, { windows } = {}) {
  const path = String(homePath || '').trim() || FALLBACK_HOME_PATH;
  const useWindows = windows == null ? isWindowsHomePath(path) || path === FALLBACK_HOME_PATH : Boolean(windows);

  if (useWindows) {
    return [
      `cd "${path}"`,
      '',
      `curl.exe -L -o ${PLUGIN_ZIP} "${PLUGIN_ZIP_URL}"`,
      'New-Item -ItemType Directory -Force -Path "plugins\\ASFBotSocial" | Out-Null',
      `Expand-Archive -Path "${PLUGIN_ZIP}" -DestinationPath "plugins\\ASFBotSocial" -Force`,
      `Remove-Item "${PLUGIN_ZIP}"`,
    ].join('\n');
  }

  return [
    `cd "${path}"`,
    '',
    `curl -L -o ${PLUGIN_ZIP} "${PLUGIN_ZIP_URL}"`,
    'mkdir -p plugins/ASFBotSocial',
    `unzip -o ${PLUGIN_ZIP} -d plugins/ASFBotSocial`,
    `rm ${PLUGIN_ZIP}`,
  ].join('\n');
}
