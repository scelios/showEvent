import {
  JIRA_TOKENS,
  buildJiraBrowseUrl,
  buildJiraSearchUrl,
  fetchJiraIssueDetails,
  fetchJiraResources,
  fetchJiraSearch,
  getJiraBaseUrl,
  getJiraToken,
  getResourceLabel,
} from '../../jiraHelpers';

describe('jiraHelpers', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('gets labels by configurable key and falls back to resource.name', () => {
    expect(getResourceLabel({ labels: { app: 'my-app', name: 'default' } }, 'app')).toBe('my-app');
    expect(getResourceLabel({ labels: { other: 'x' }, name: 'fallback-name' })).toBe('fallback-name');
  });

  it('throws when no label or name can be resolved', () => {
    expect(() => getResourceLabel({ labels: { other: 'x' } })).toThrow('No suitable label found for resource');
  });

  it('returns a jira token for the requested profile', () => {
    expect(getJiraToken()).toBe(JIRA_TOKENS.stg);
    expect(getJiraToken('missing-profile')).toBe(JIRA_TOKENS.stg);
  });

  it('returns a jira base url fallback when one is missing', () => {
    expect(getJiraBaseUrl('https://jira.example.com')).toBe('https://jira.example.com');
    expect(getJiraBaseUrl('')).toBe('https://jira-stg.steelhome.internal');
  });

  it('builds jira search urls with fields', () => {
    const url = buildJiraSearchUrl('https://jira.example.com', 'project = MTSRE', ['key', 'summary']);

    expect(url).toBe('https://jira.example.com/rest/api/2/search?jql=project+%3D+MTSRE&fields=key%2Csummary');
  });

  it('fetches jira search results with a get request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ issues: [] }),
    });

    await fetchJiraSearch({
      baseUrl: 'https://jira.example.com',
      token: 'token-123',
      jql: 'project = MTSRE',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://jira.example.com/rest/api/2/search?jql=project+%3D+MTSRE&fields=key%2Csummary%2Clabels',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('fetches jira search results with a post body when requested', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ issues: [] }),
    });

    await fetchJiraSearch({
      baseUrl: 'https://jira.example.com',
      token: 'token-123',
      jql: 'project = MTSRE',
      method: 'POST',
      includeBody: true,
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ jql: 'project = MTSRE', fields: ['key', 'summary', 'labels'] }),
    });
  });

  it('fetches issue details and validates the payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ fields: { summary: 'Issue' } }),
    });

    const result = await fetchJiraIssueDetails({
      url: 'https://jira.example.com/rest/api/2/issue/PROJ-1',
      token: 'token-123',
    });

    expect(result).toEqual({ fields: { summary: 'Issue' } });
  });

  it('builds jira browse urls', () => {
    expect(buildJiraBrowseUrl('https://jira.example.com', 'PROJ-1')).toBe('https://jira.example.com/browse/PROJ-1');
  });

  it('fetches and maps jira resources through the generic helper', async () => {
    const searchResult = {
      issues: [
        { key: 'PROJ-1', self: 'https://jira.example.com/rest/api/2/issue/PROJ-1' },
        { key: 'PROJ-2', self: 'https://jira.example.com/rest/api/2/issue/PROJ-2' },
      ],
    };

    const issueDetail1 = { fields: { summary: 'Issue 1', issuetype: { name: 'Story' } } };
    const issueDetail2 = { fields: { summary: 'Issue 2', issuetype: { name: 'Test' } } };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(searchResult),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(issueDetail1),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(issueDetail2),
      });

    const result = await fetchJiraResources({
      resource: { labels: { name: 'my-label' } },
      labelKey: 'name',
      buildJql: (label) => `project = MTSRE and labels in (${label})`,
      baseUrl: 'https://jira.example.com',
      token: 'token-123',
      shouldIncludeIssue: ({ issueTypeName }) => issueTypeName !== 'Test',
      mapIssueToRow: ({ element, issueData }) => ({
        id: element.key,
        name: issueData.fields.summary,
      }),
    });

    expect(result.rows).toEqual([{ id: 'PROJ-1', name: 'Issue 1' }]);
  });
});