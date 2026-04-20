import { getEmailFromJwtCookies } from '../../components/getEmailFromJwtCookies';
import * as jwtDecodeModule from 'jwt-decode';

jest.mock('jwt-decode');

describe('getEmailFromJwtCookies', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      configurable: true,
      value: ''
    });
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Valid Cookie Tests', () => {
    it('should return email from valid R_OIDC_ID cookie', () => {
      const validToken = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJobTJQeGVBb3ZsMFdvVEZuM2hmSENVTVMxazRrb2dSWVpfNE9tdjZYYU9BIn0.eyJleHAiOjE3NzQ1MTE1MDgsImlhdCI6MTc3NDUxMTIwOCwiYXV0aF90aW1lIjoxNzc0NTExMjA4LCJqdGkiOiI0MTA4MDIwMC00M2MwLTRhZTYtYWE0My03Y2ExOWUwN2RmZjUiLCJpc3MiOiJodHRwczovL2lhbS5zdGVlbGhvbWUuaW50ZXJuYWwvYXV0aC9yZWFsbXMvc3RlZWxob21lIiwiYXVkIjoibXRNQy1yYW5jaGVyLXByZCIsInN1YiI6IjZhMWU2ZmFkLTQ0NTUtNGZiNi1iMGY1LTQ3YmQ0Y2I2ZjYxOSIsInR5cCI6IklEIiwiYXpwIjoibXRNQy1yYW5jaGVyLXByZCIsInNlc3Npb25fc3RhdGUiOiJkNDQ4NmQ3Zi0wNzdmLTQxMGMtOTNkOS1jYzNkOWQ3NDRkNmUiLCJhdF9oYXNoIjoid2VfR2JtLTVLcmhQZV9nSmwxd1ZEZyIsImFjciI6IjEiLCJuYW1lIjoiQmVub2l0IEFVRElCRVJUIiwiZ3JvdXBzIjpbIlVTRVJTX01UTUNfU1JFIl0sInByZWZlcnJlZF91c2VybmFtZSI6ImIuYXVkaWJlcnRAbXRtYyIsImdpdmVuX25hbWUiOiJCZW5vaXQiLCJmYW1pbHlfbmFtZSI6IkFVRElCRVJUIiwiZW1haWwiOiJiLmF1ZGliZXJ0QG1vbmFjby10ZWxlY29tLm1jIn0.BbB8pr-66pOmGgBAosBRC3a4aaHWjRPJNrgCLNSm23mruMqeKXzvygm4CF34MM6hgcS_MO4fNBgvGvlY2VioGjS_EyoZJfOI_8v4eB8eMpIKmM5ZJJfTXNGXwqnxfbwEzrCyfwFqZDa4wwZwitQZIPizJPeqv1FXdj5O1xS-Y6Xbi_ZIZ4ULoX5B9TRwjCzGtk5akaAv9HJzq3z0XVeb9gkSJPOLVFQFCH1YQ73DrfiGMys0zXSFqK9ffkYnTLasaGqNcEI9TzERASd18ixupLzwtqWtUfH45wLtY96EH1Ijt9sTLlzX6uBAirahp7wyFeDWk9uqzKwc6AGGzqKTwA';

      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: 'b.audibert@monaco-telecom.mc'
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBe('b.audibert@monaco-telecom.mc');
      expect(jwtDecodeModule.jwtDecode).toHaveBeenCalledWith(validToken);
    });

    it('should handle email with whitespace correctly', () => {
      const validToken = 'valid.jwt.token';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: '  b.audibert@monaco-telecom.mc  '
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBe('b.audibert@monaco-telecom.mc');
    });
  });

  describe('No Cookie Tests', () => {
    it('should return null when no cookies are set', () => {
      document.cookie = '';

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
      expect(jwtDecodeModule.jwtDecode).not.toHaveBeenCalled();
    });

    it('should return null when R_OIDC_ID cookie is not present', () => {
      document.cookie = 'R_PCS=light; R_LOCALE=en-us; R_REDIRECTED=true';

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
      expect(jwtDecodeModule.jwtDecode).not.toHaveBeenCalled();
    });

    it('should return null when R_OIDC_ID cookie is empty', () => {
      document.cookie = 'R_OIDC_ID=';

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
      expect(jwtDecodeModule.jwtDecode).not.toHaveBeenCalled();
    });
  });

  describe('Bad Cookie Tests', () => {
    it('should return null when jwt-decode throws an error with malformed token', () => {
      const badToken = 'not.a.valid.token.at.all';
      document.cookie = `R_OIDC_ID=${badToken}`;

      jwtDecodeModule.jwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to decode JWT:', expect.any(Error));
    });

    it('should return null when token payload is invalid JSON', () => {
      const badToken = 'invalid';
      document.cookie = `R_OIDC_ID=${badToken}`;

      jwtDecodeModule.jwtDecode.mockImplementation(() => {
        throw new SyntaxError('Unexpected token');
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to decode JWT:', expect.any(Error));
    });
  });

  describe('Missing Email Claim Tests', () => {
    it('should return null when email claim is missing from payload', () => {
      const validToken = 'valid.jwt.token';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        sub: '6a1e6fad-4455-4fb6-b0f5-47bd4cb6f619',
        name: 'Benoit AUDIBERT'
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
    });

    it('should return null when email is empty string', () => {
      const validToken = 'valid.jwt.token';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: ''
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
    });

    it('should return null when email is only whitespace', () => {
      const validToken = 'valid.jwt.token';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: '   '
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
    });

    it('should return null when email claim is null', () => {
      const validToken = 'valid.jwt.token';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: null
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBeNull();
    });
  });

  describe('Special Characters in Cookie', () => {
    it('should handle cookie with multiple semicolons and other cookies', () => {
      const validToken = 'token.with.dots';
      document.cookie = `R_PCS=light; R_LOCALE=en-us; R_OIDC_ID=${validToken}; R_SESS=another-token`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: 'test@example.com'
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBe('test@example.com');
    });

    it('should handle cookie value with special URL-encoded characters', () => {
      const validToken = 'encoded%20token%3Dvalue';
      document.cookie = `R_OIDC_ID=${validToken}`;

      jwtDecodeModule.jwtDecode.mockReturnValue({
        email: 'user@domain.com'
      });

      const email = getEmailFromJwtCookies();
      expect(email).toBe('user@domain.com');
      expect(jwtDecodeModule.jwtDecode).toHaveBeenCalled();
    });
  });
});
