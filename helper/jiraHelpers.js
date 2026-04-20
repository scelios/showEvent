export const DEFAULT_JIRA_BASE_URL = 'https://jira-stg.steelhome.internal';
export const JIRA_TOKENS = {
  stg: '',
};

export function getJiraToken(profile = 'stg') {
  return JIRA_TOKENS[profile] || JIRA_TOKENS.stg;
}

export function getJiraBaseUrl(jiraUrl = DEFAULT_JIRA_BASE_URL) {
  return jiraUrl || DEFAULT_JIRA_BASE_URL;
}

export function getResourceLabel(resource, labelKey = 'name') {
  const targetKey = String(labelKey || 'name').toLowerCase();
  const labels = resource?.labels || {};

  for (const key in labels) {
    if (key.toLowerCase() === targetKey) {
      return labels[key];
    }
  }

  if (resource?.name) {
    return resource.name;
  }

  throw new Error('No suitable label found for resource');
}

function buildJiraHeaders(token) {
  return {
    Authorization: `Bearer ${ token }`,
    Accept: 'application/json',
  };
}

export function buildJiraSearchUrl(baseUrl, jql, fields = ['key', 'summary', 'labels']) {
  if (!baseUrl) {
    throw new Error('No Jira base URL provided');
  }

  const url = new URL(baseUrl + '/rest/api/2/search');
  url.searchParams.set('jql', jql);
  url.searchParams.set('fields', Array.isArray(fields) ? fields.join(',') : String(fields));

  return url.toString();
}

export async function fetchJiraSearch({
  baseUrl,
  token,
  jql,
  fields = ['key', 'summary', 'labels'],
  method = 'GET',
  includeBody = false,
}) {
  const url = buildJiraSearchUrl(baseUrl, jql, fields);
  const options = {
    method,
    headers: buildJiraHeaders(token),
  };

  if (includeBody) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ jql, fields });
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${ response.status }`);
  }

  return response.json();
}

export async function fetchJiraIssueDetails({ url, token }) {
  const response = await fetch(url, {
    method: 'GET',
    headers: buildJiraHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${ response.status }`);
  }

  const issueData = await response.json();

  if (!issueData || !issueData.fields) {
    throw new Error('Invalid data format received from Jira API for issue details');
  }

  return issueData;
}

export async function fetchJiraResources({
  resource,
  labelKey = 'name',
  buildJql,
  baseUrl,
  token,
  shouldIncludeIssue = () => true,
  mapIssueToRow,
  onInvalidIssue,
}) {
  if (typeof buildJql !== 'function') {
    throw new Error('buildJql must be a function');
  }

  if (typeof mapIssueToRow !== 'function') {
    throw new Error('mapIssueToRow must be a function');
  }

  const label = getResourceLabel(resource, labelKey);
  const jql = buildJql(label);

  const data = await fetchJiraSearch({
    baseUrl,
    token,
    jql,
    fields: ['key', 'summary', 'labels'],
    method: 'GET',
  });

  if (!data || !Array.isArray(data.issues)) {
    throw new Error('Invalid data format received from Jira API');
  }

  const rows = [];

  for (const element of data.issues) {
    const issueData = await fetchJiraIssueDetails({
      url: element.self,
      token,
    });

    if (!issueData || !issueData.fields) {
      if (typeof onInvalidIssue === 'function') {
        onInvalidIssue(element);
      }
      continue;
    }

    const issueTypeName = issueData.fields?.issuetype?.name;
    if (!shouldIncludeIssue({ element, issueData, issueTypeName })) {
      continue;
    }

    rows.push(mapIssueToRow({ element, issueData, issueTypeName }));
  }

  return { rows, jql };
}

export function buildJiraBrowseUrl(baseUrl, issueKey) {
  if (!baseUrl) {
    throw new Error('No Jira base URL provided');
  }

  return `${ baseUrl }/browse/${ issueKey }`;
}