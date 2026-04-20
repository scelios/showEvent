export async function fetchJson(url) {
  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'application/json' },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GET ${url} failed: ${resp.status} ${resp.statusText}: ${text}`);
  }

  return await resp.json();
}