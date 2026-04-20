import { jwtDecode } from 'jwt-decode';

function getCookie(name: string): string | null {
    const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
}

interface JwtPayload {
    email?: string;
    [key: string]: unknown;
}

export function getEmailFromJwtCookies(): string | null {
    const token = getCookie('R_OIDC_ID');
    if (!token) {
        return null;
    }

    try {
        // Decodes the payload securely and handles base64url
        const payload = jwtDecode<JwtPayload>(token);
        const email = (payload?.email || '').trim();

        return email || null;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}