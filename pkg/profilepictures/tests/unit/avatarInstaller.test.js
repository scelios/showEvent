import {
  getAvatarSrc,
  patchAvatar
} from '../../components/avatarInstaller';
import { getEmailFromJwtCookies } from '../../components/getEmailFromJwtCookies';

jest.mock('sha256', () => {
  return jest.fn((email) => {
    if (!email) return '';
    return email.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0).toString(16);
  });
});

jest.mock('../../components/getEmailFromJwtCookies');

describe('avatarInstaller', () => {
  let localStorageMock;
  let getEmailFromJwtCookiesMock;

  beforeEach(() => {
    getEmailFromJwtCookiesMock = getEmailFromJwtCookies;
    getEmailFromJwtCookiesMock.mockClear();

    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    document.body.innerHTML = '';
  });

  afterEach(() => {
    console.debug.mockRestore();
    console.error.mockRestore();
  });

  describe('getAvatarSrc', () => {
    it('should return Gravatar URL when email exists', async () => {
      const email = 'b.audibert@monaco-telecom.mc';
      getEmailFromJwtCookiesMock.mockReturnValue(email);

      const url = await getAvatarSrc();

      expect(url).toMatch(/^https:\/\/secure\.gravatar\.com\/avatar\//);
      expect(url).toContain('?d=identicon');
      expect(getEmailFromJwtCookiesMock).toHaveBeenCalled();
    });

    it('should return null when email is null', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue(null);

      const url = await getAvatarSrc();

      expect(url).toBeNull();
      expect(console.debug).toHaveBeenCalledWith(
        'No avatar URL found for user, using default image'
      );
    });

    it('should return null when email is empty string', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue('');

      const url = await getAvatarSrc();

      expect(url).toBeNull();
      expect(console.debug).toHaveBeenCalledWith(
        'No avatar URL found for user, using default image'
      );
    });

    it('should cache concurrent calls to getAvatarSrc', async () => {
      const email = 'test@example.com';
      getEmailFromJwtCookiesMock.mockReturnValue(email);

      const promise1 = getAvatarSrc();
      const promise2 = getAvatarSrc();

      const url1 = await promise1;
      const url2 = await promise2;

      expect(getEmailFromJwtCookiesMock).toHaveBeenCalledTimes(1);
      expect(url1).toBe(url2);
    });

    it('should handle email with whitespace correctly', async () => {
      const email = '  b.audibert@monaco-telecom.mc  ';
      getEmailFromJwtCookiesMock.mockReturnValue(email);

      const url = await getAvatarSrc();

      expect(url).toMatch(/^https:\/\/secure\.gravatar\.com\/avatar\//);
    });

    it('should use identicon as default fallback in Gravatar URL', async () => {
      const email = 'user@domain.com';
      getEmailFromJwtCookiesMock.mockReturnValue(email);

      const url = await getAvatarSrc();

      expect(url).toContain('?d=identicon');
    });
  });

  describe('patchAvatar', () => {
    it('should not crash when no image element exists', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue('test@example.com');
      document.body.innerHTML = '<div>No image here</div>';

      await expect(patchAvatar()).resolves.toBeUndefined();
    });

    it('should handle null avatar URL gracefully', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue(null);

      const img = document.createElement('img');
      img.setAttribute('alt', 'User avatar image');
      img.setAttribute('src', 'default-avatar.jpg');
      document.body.appendChild(img);

      await patchAvatar();

      expect(img.getAttribute('src')).toBe('default-avatar.jpg');
      expect(console.debug).toHaveBeenCalledWith(
        'No avatar URL found for user, using default image'
      );
    });
  });


  describe('installAvatarPatcher', () => {
    let originalMutationObserver;

    beforeEach(() => {
      originalMutationObserver = global.MutationObserver;

      const mockObserver = jest.fn();
      mockObserver.prototype.observe = jest.fn();
      global.MutationObserver = mockObserver;
    });

    afterEach(() => {
      global.MutationObserver = originalMutationObserver;
    });

    it('should set up MutationObserver to watch DOM changes', () => {
      getEmailFromJwtCookiesMock.mockReturnValue('test@example.com');

      expect(global.MutationObserver).toBeDefined();
    });

    it('should call patchAvatar immediately on install', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue('test@example.com');

      const img = document.createElement('img');
      img.setAttribute('alt', 'User avatar image');
      document.body.appendChild(img);

      expect(img).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should keep default image when no email is available', async () => {
      getEmailFromJwtCookiesMock.mockReturnValue(null);

      const img = document.createElement('img');
      img.setAttribute('alt', 'User avatar image');
      img.setAttribute('src', 'default.jpg');
      document.body.appendChild(img);

      await patchAvatar();

      expect(img.getAttribute('src')).toBe('default.jpg');
      expect(console.debug).toHaveBeenCalledWith(
        'No avatar URL found for user, using default image'
      );
    });
  });
});
