const STORAGE_KEY = 'profilepictures.avatar.dataUrl';
import { getEmailFromJwtCookies } from './getEmailFromJwtCookies';
import sha256 from 'sha256';
let installed = false;
let patchScheduled = false;

function schedulePatchAvatar() {
  if (patchScheduled) {
    return;
  }

  patchScheduled = true;
  requestAnimationFrame(() => {
    patchScheduled = false;
    void patchAvatar();
  });
}


export function setAvatarDataUrl(dataUrl: string) {
  window.localStorage.setItem(STORAGE_KEY, dataUrl);
  patchAvatar();
}

export function installAvatarPatcher() {
  if (installed) {
    return;
  }
  installed = true;

  schedulePatchAvatar();

  // Observe only the header menu subtree and structural changes.
  const observer = new MutationObserver(() => {
    schedulePatchAvatar();
  });

  const headerRoot = document.querySelector('[data-testid="nav_header_showUserMenu"]') || document.body;

  observer.observe(headerRoot, {
    subtree: true,
    childList: true,
  });
}

let fetching: Promise<string | null> | null = null;


function gravatarUrlFromEmail(email: string | null): string | null {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) {
    // return `https://secure.gravatar.com/avatar/${sha256('b.audibert@monaco-telecom.mc')}?d=identicon`; // use for testing with a known gravatar
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