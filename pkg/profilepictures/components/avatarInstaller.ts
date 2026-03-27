const STORAGE_KEY = 'linkedressources.avatar.dataUrl';
import { getEmailFromJwtCookies } from './getEmailFromJwtCookies';
let installed = false;


export function setAvatarDataUrl(dataUrl: string) {
  window.localStorage.setItem(STORAGE_KEY, dataUrl);
  patchAvatar();
}

export function installAvatarPatcher() {
  if (installed) {
    return;
  }
  installed = true;

  patchAvatar();

  // Patch on DOM updates (SPA rerenders)
  const observer = new MutationObserver(() => {
    patchAvatar();
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'style', 'alt']
  });
}

let fetching: Promise<string | null> | null = null;


function gravatarUrlFromEmail(email: string | null): string | null {
  const normalized = (email || '').trim().toLowerCase();
  const sha256 = require('sha256');
  if (!normalized) {
    // return `https://secure.gravatar.com/avatar/${sha256('j.martin@monaco-telecom.mc')}?d=identicon`;
    return null;
  }
  return `https://secure.gravatar.com/avatar/${sha256(normalized)}?d=identicon`;
}


export async function getAvatarSrc(): Promise<string | null>  {
  if (!fetching) {
    fetching = (async () => {
      const email = getEmailFromJwtCookies();
      const url = gravatarUrlFromEmail(email);
      if (!url) {
        console.debug('No avatar URL found for user, using default image');
        return null;
      }
      // If the annotation isn't set, fallback to default image
      return url;
    })().finally(() => {
      fetching = null;
    });
  }

  return fetching;
}

export async function patchAvatar() {
  const img =
    document.querySelector('[data-testid="nav_header_showUserMenu"] img') ||
    document.querySelector('img[alt="User avatar image"]');

  if (!img) {
    return;
  }

  const desired = await getAvatarSrc();
  if (desired && img.getAttribute('src') !== desired){
    img.setAttribute('src', desired);
  }

}