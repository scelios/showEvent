export function buildApiUrlFromSelfLink(selfLink, extraQuery = {}) {
    if (!selfLink) {
      throw new Error('No selfLink provided');
    }
    selfLink = selfLink.split('#')[0];
    // if there's no "v1" in the path, it's likely a Steve API link and we need to transform it
    if (!selfLink.includes('/v1/')) {
      selfLink = getApiUrlFromBrowserUrl(selfLink) ;
    }
    // selfLink might be absolute or relative; URL() handles both
    const url = new URL(selfLink, window.location.origin);
    // console.debug('Resource selfLink:', url);
  
    // Add/override query params
    Object.entries(extraQuery).forEach(([k, v]) => {
      if (v === undefined || v === null) {
        return;
      }
      url.searchParams.set(k, String(v));
    });
  
    return url.toString();
}

export function getApiUrlFromBrowserUrl(browserUrl) {
  try {
    const url = new URL(browserUrl);
    
    // Regex matches: optional /dashboard, then /c/, then clusterId, then product (explorer/apps), then the rest
    // Example capture: Group 1 (clusterId)="c-kprv7", Group 3 (rest)="node/vlc-rke2..."
    const match = url.pathname.match(/(?:\/dashboard)?\/c\/([^/]+)\/([^/]+)\/(.+)/);

    if (!match) {
      console.warn('Could not parse Rancher URL structure:', browserUrl);
      return null;
    }

    const [fullMatch, clusterId, product, resourcePath] = match;
    (void product); // Those void are to silence unused variable warnings 
    (void fullMatch); 

    // 1. Determine API Base
    let apiBase = '';
    if (clusterId === 'local') {
      apiBase = '/v1';
    } else {
      apiBase = `/k8s/clusters/${clusterId}/v1`;
    }

    // 2. Transform Resource Path (Simplistic pluralization)
    // resourcePath is likely "type/namespace/name" or "type/name"
    // Remove query params or hash if any before splitting
    const pathClean = resourcePath.split(/[?#]/)[0];
    const parts = pathClean.split('/');
    if (parts.length > 0) {
      // The first segment is the singular type (e.g. "pod"). 
      // The Steve API expects plural (e.g. "pods").
      // NOTE: This simple 's' append works for most resources (pod->pods, node->nodes, app->apps)
      // but might fail for complex irregularities unless you have a schema dictionary.
      parts[0] = parts[0] + 's'; 
    }
    const finalPath = parts.join('/');

    // 3. Reconstruct
    return `${url.origin}${apiBase}/${finalPath}`;
    
  } catch (e) {
    console.error('Error generating API URL:', e);
    return null;
  }
}

export function getResourceUrl(res) {
  try {
      // as requested: url = self.url.split('/')[-2] + {type} + {name}
      // Remove last 2 segments and append type + name
      const parts = window.location.href.split('/');
      parts.pop();
      parts.pop();
      parts.pop();
      return parts.join('/') + '/' + (res.kind || res.type) + '/' + res.namespace + '/' + res.name;
  } catch(e) {
     console.warn('Failed to build URL for resource', res, e);
      return '#';
  }
}
