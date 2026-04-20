import { buildApiUrlFromSelfLink, getApiUrlFromBrowserUrl } from '../../../../helper/apiUrlHelpers.js';

describe('apiUrlHelpers.js', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('getApiUrlFromBrowserUrl', () => {
    it('handles simple local cluster URL correctly (singular type -> plural)', () => {
      const input = 'https://localhost:8080/c/local/explorer/database.gosqlenjayne.sre.monaco-telecom.mc.database/sre-system/mt-galera-glxat-services-management';
      const expected = 'https://localhost:8080/v1/database.gosqlenjayne.sre.monaco-telecom.mc.databases/sre-system/mt-galera-glxat-services-management';
      
      const result = getApiUrlFromBrowserUrl(input);
      expect(result).toBe(expected);
    });

    it ('handles rancher internal URL correctly ', () => {
      const input = 'https://rancher.steelhome.internal/dashboard/c/c-8t5m7/explorer/external-secrets.io.externalsecret/gitlab-runner/gitlab-steelhome-cabundle';
      const expected = 'https://rancher.steelhome.internal/k8s/clusters/c-8t5m7/v1/external-secrets.io.externalsecrets/gitlab-runner/gitlab-steelhome-cabundle';
      
      const result = getApiUrlFromBrowserUrl(input);
      expect(result).toBe(expected);
    });

    it('handles remote cluster URL correctly (singular type -> plural)', () => {
      const input = 'https://rancher.steelhome.internal/dashboard/c/c-8t5m7/explorer/external-secrets.io.externalsecret/gitlab-runner/gitlab-steelhome-cabundle';
      const expected = 'https://rancher.steelhome.internal/k8s/clusters/c-8t5m7/v1/external-secrets.io.externalsecrets/gitlab-runner/gitlab-steelhome-cabundle';
      
      const result = getApiUrlFromBrowserUrl(input);
      expect(result).toBe(expected);
    });

    it('returns null on garbage URL', () => {
      const input = 'garbage-data';
      expect(getApiUrlFromBrowserUrl(input)).toBe(null);
    });

    it('returns null on URL without proper Rancher structure', () => {
      const input = 'https://google.com/search?q=rancher';
      expect(getApiUrlFromBrowserUrl(input)).toBe(null);
    });
  });

  describe('buildApiUrlFromSelfLink', () => {
    it('uses valid selfLink with v1 as-is', () => {
      const selfLink = 'https://rancher/v1/pods/mypod';
      const result = buildApiUrlFromSelfLink(selfLink);
      expect(result).toBe(selfLink);
    });

    it('transforms non-v1 link (e.g. browser URL passed as selfLink)', () => {
      // Mock getApiUrlFromBrowserUrl behavior indirectly or rely on implementation
      // Since it calls getApiUrlFromBrowserUrl internally, we test the integration
      const selfLink = 'https://rancher.steelhome.internal/dashboard/c/c-8t5m7/explorer/pod/ns/name';
      
      // Expected: "pod" -> "pods"
      const expected = 'https://rancher.steelhome.internal/k8s/clusters/c-8t5m7/v1/pods/ns/name';
      
      const result = buildApiUrlFromSelfLink(selfLink);
      expect(result).toBe(expected);
    });

    it('adds query parameters', () => {
      const selfLink = 'https://rancher/v1/pods/mypod';
      const result = buildApiUrlFromSelfLink(selfLink, { exclude: 'metadata', answer: 42 });
      expect(result).toBe('https://rancher/v1/pods/mypod?exclude=metadata&answer=42');
    });

    it('ignores null/undefined query parameters', () => {
      const selfLink = 'https://rancher/v1/pods/mypod';
      const result = buildApiUrlFromSelfLink(selfLink, { exclude: null, answer: undefined, valid: 'yes' });
      expect(result).toBe('https://rancher/v1/pods/mypod?valid=yes');
    });

    it('throws error if selfLink is missing', () => {
      expect(() => buildApiUrlFromSelfLink(null)).toThrow('No selfLink provided');
    });
  });

});
