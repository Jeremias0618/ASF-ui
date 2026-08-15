import { openPluginMissingModal } from './bus';
import { isBotSocialPluginLoaded } from './detect';

export async function ensureBotSocialPluginOrModal() {
  try {
    const loaded = await isBotSocialPluginLoaded();
    if (loaded) return true;
  } catch (err) {
    return true;
  }

  openPluginMissingModal();
  return false;
}

export async function requireBotSocialPlugin(to, from, next) {
  const ok = await ensureBotSocialPluginOrModal();
  if (ok) {
    next();
    return;
  }

  if (to.params?.bot) {
    next({ name: 'bot', params: { bot: to.params.bot } });
    return;
  }

  next({ name: 'multi-action' });
}
