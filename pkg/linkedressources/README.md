# Linked Resources Extension

This extension displays linked resources and related events for any Kubernetes or Rancher resource. It automatically detects relationships and event associations, displaying them in a dedicated panel that integrates seamlessly with the Rancher dashboard.

- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Performance & Limitations](#performance--limitations)

## Installation

Install this extension from the Rancher Catalog:
1. Navigate to **Extensions** in your Rancher dashboard
2. Search for "Linked Resources"
3. Click **Install**

## Usage

After installation, navigate to any resource detail page (pod, deployment, secret, etc.). The extension adds a tabbed panel at the bottom of the page labeled **Extensions** containing two tabs:

- **Linked Resources** – Shows resources that reference or are referenced by the current resource
- **Events** – Displays recent events associated with the resource

Click on any linked resource to navigate to its detail page. Tabs are automatically hidden if native Rancher tabs ("Related" or "Recent Events") are already present to avoid duplication.

## Architecture

### Linked Resources Discovery

The extension uses the `metadata.relationships` field to identify linked resources:

1. **Primary Method** – Reads relationships directly from the resource object's metadata (no network call required)
2. **Fallback Method** – If relationships are not present, the extension fetches the full resource via API and extracts relationships from the response

### Event Retrieval

The extension fetches events using the Rancher API with server-side filtering:
- For resources with a UID: filters by `involvedObject.uid` (most reliable)
- For namespaced resources: filters by namespace and performs client-side filtering by kind/name
- For Namespace resources: filters by `metadata.namespace`

Results are limited to 500 events per query for performance.

### Panel Registration

The extension registers as a dynamic panel that appears at the top of resource detail pages. It automatically hides itself if native Rancher tabs ("Related" or "Recent Events") are detected to prevent duplication.


## Performance & Limitations

### Caching & Network Behavior

- **Relationships** – Loaded from the in-memory store when available; API calls only occur when fetching full resource details
- **Polling** – The extension reloads data when the resource changes, the route changes, or the component mounts

### Known Limitations

1. **Relationship Detection** relies on the Rancher API providing the `metadata.relationships` field. Some custom resources may not populate this field.
2. **Event Count** is limited to 500 results returned by a single API query. Clusters with high event volume may not reflect the complete count.


## Comptability
Some warnings have been silenced (Sass deprecation warnings, see vue.config.js) to avoid noise in the console. Those warnings have been silenced since they come from rancher and are not actionable for extension developers.
