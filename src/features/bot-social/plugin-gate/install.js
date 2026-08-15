import { post } from '../../../plugins/http';
import {
  PLUGIN_DLL,
  PLUGIN_GITHUB_API,
  PLUGIN_NAME,
  PLUGIN_ZIP,
} from './constants';
import { extractZipFile, isPluginDllName } from './unzip';

async function readDirectoryNames(dirHandle) {
  const names = [];
  if (!dirHandle || typeof dirHandle.values !== 'function') return names;
  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of dirHandle.values()) {
    names.push({ name: entry.name, kind: entry.kind });
  }
  return names;
}

async function resolvePluginsDirectory(root) {
  const entries = await readDirectoryNames(root);
  const lower = name => String(name || '').toLowerCase();
  const selfName = lower(root.name);

  if (selfName === 'plugins') return root;

  const pluginsEntry = entries.find(entry => entry.kind === 'directory' && lower(entry.name) === 'plugins');
  if (pluginsEntry) {
    return root.getDirectoryHandle(pluginsEntry.name);
  }

  return root;
}

export async function fetchLatestReleaseAsset() {
  const releaseRes = await fetch(`${PLUGIN_GITHUB_API}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!releaseRes.ok) throw new Error('release-fetch');

  const release = await releaseRes.json();
  const asset = (release.assets || []).find(item => String(item.name) === PLUGIN_ZIP);
  const downloadUrl = asset?.browser_download_url;
  if (!downloadUrl) throw new Error('asset-missing');

  return {
    downloadUrl,
    tag: String(release.tag_name || ''),
  };
}

export function triggerBrowserDownload(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || PLUGIN_ZIP;
  link.rel = 'noopener noreferrer';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function readZipFromUser() {
  if (typeof window.showOpenFilePicker === 'function') {
    const [handle] = await window.showOpenFilePicker({
      excludeAcceptAllOption: false,
      types: [{
        description: PLUGIN_ZIP,
        accept: { 'application/zip': ['.zip'] },
      }],
    });
    const file = await handle.getFile();
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        reject(new Error('zip-cancelled'));
        return;
      }
      resolve(file.arrayBuffer());
    }, { once: true });
    input.click();
  });
}

export async function dllFromZipBuffer(zipBuffer) {
  return extractZipFile(zipBuffer, isPluginDllName);
}

export async function writePluginDll(dllBytes) {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error('picker-unsupported');
  }

  const picked = await window.showDirectoryPicker({
    id: 'asf-plugins',
    mode: 'readwrite',
  });
  const pluginsDir = await resolvePluginsDirectory(picked);
  const folder = await pluginsDir.getDirectoryHandle(PLUGIN_NAME, { create: true });
  const file = await folder.getFileHandle(PLUGIN_DLL, { create: true });
  const writable = await file.createWritable();
  await writable.write(dllBytes);
  await writable.close();
}

export function downloadDllFallback(dllBytes) {
  const blob = new Blob([dllBytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = PLUGIN_DLL;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function restartAsf() {
  return post('asf/restart');
}
