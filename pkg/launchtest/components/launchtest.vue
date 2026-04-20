<template>
  <div class="extension-container">
    <div v-if="isLoading">
      <i class="icon icon-spinner icon-spin" /> Loading test...
    </div>
    <div
      v-else-if="errorMessage"
      class="error"
    >
      {{ errorMessage }}
    </div>
  
    <div v-else-if="!hasResources">
      No test found for this resource.
    </div>
  
    <div v-else>
      <div
        v-if="values.test.length > 0"
        class="mb-test"
      >
        <h3>Launch Test</h3>
        <ResourceTable
          :schema="null"
          :rows="testRows"
          :headers="testHeaders"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="false"
          :groupable="false"
          :namespaced="false"
        >
          <template #cell:state="{ row }">
            <span>{{ row.state || '-' }}</span>
          </template>

          <template #cell:description="{ row }">
            <span>{{ row.description || '-' }}</span>
          </template>

          <template #cell:url="{ row }">
            <a
              v-if="row.url"
              :href="row.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ row.url }}
            </a>
            <span v-else>-</span>
          </template>

          <template #cell:actions="{ row }">
            <button
              class="btn role-primary show-configuration"
              type="button"
              @click="launchTest(row)"
            >
              Launch
            </button>
          </template>
        </ResourceTable>
      </div>
    </div>
  </div>
</template>

<script>
import ResourceTable from '@shell/components/ResourceTable';
import {
  buildJiraBrowseUrl,
  fetchJiraResources,
  getJiraBaseUrl,
  getJiraToken,
} from '../../../helper/jiraHelpers';

export default {
  name: 'LaunchTest',

  components: { ResourceTable },

  props: {
    resource: { type: Object, required: true },
    labelKey: { type: String, default: 'name' },
    projectsKey: { type: String, default: 'MTQAXRAY' },
  },

  data() {
    return {
      isLoading: false,
      errorMessage: null,
      values: {
        test: [],
      },
      hasResources: false

    };
  },

  computed: {
    testHeaders() {
      return [
        { name: 'name', label: 'Name', value: 'name', sort: ['nameSort', 'name'] },
        { name: 'description', label: 'Description', value: 'description', sort: ['descriptionSort', 'description'] },
        { name: 'url', label: 'URL', value: 'url' },
        { name: 'actions', label: 'Actions', value: 'actions' },
      ];
    },

    testRows() {
      return (this.values.test || []).map((test) => ({
        ...test,
        _key: test._key || test.id || test.url || test.name,
        metadata: test.metadata || { name: test.name || '', namespace: '' },
        nameSort: (test.name || '').toLowerCase(),
        descriptionSort: (test.description || '').toLowerCase(),
        urlSort: (test.url || '').toLowerCase(),
      }));
    }
  },

  watch: {
    resource: {
      handler() {
        this.fetchtest();
      },
      immediate: true
    }
  },

  methods: {

    async launchTest(row) {
      const issueKey = row?.id || row?._key;

      if (!issueKey) {
        this.errorMessage = 'Cannot launch automation: missing issue key.';
        return;
      }

      this.errorMessage = null;

      const url = `${getJiraBaseUrl()}/rest/cb-automation/latest/project/17707/rule/141/execute/${encodeURIComponent(issueKey)}`;
      // const url = `${ getJiraBaseUrl() }/secure/QuickCreateIssue.jspa`;

      console.debug('Triggering automation for issue', issueKey, 'using URL:', url);
      // return;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + getJiraToken(),
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'no-check',
          },
          body: '{}',
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Automation trigger failed (${response.status}): ${body}`);
        }

        // Jira may return 200/204 with empty body when trigger is accepted
        console.log(`Automation triggered for ${issueKey} (HTTP ${response.status})`);
      } catch (err) {
        console.error('Automation trigger error:', err);
        this.errorMessage = err.message || 'Failed to trigger automation.';
      }
    },

    async fetchtest() {
      this.isLoading = true;
      this.errorMessage = null;
      this.values.test = [];
      this.hasResources = false;

      try {
        const { rows } = await fetchJiraResources({
          resource: this.resource,
          labelKey: this.labelKey,
          buildJql: (label) => `project = ${ this.projectsKey } and labels in (${ label }) and issuetype in ("Test Plan")`,
          baseUrl: getJiraBaseUrl(),
          token: getJiraToken(),
          mapIssueToRow: ({ element, issueData, issueTypeName }) => ({
            id: element.key,
            _key: element.key,
            name: issueData.fields?.summary || element.fields?.summary || element.key,
            state: issueData.fields?.status?.name || '-',
            description: issueData.fields?.description || '-',
            url: buildJiraBrowseUrl(getJiraBaseUrl(), element.key),
            type: issueTypeName || '-',
            priority: issueData.fields?.priority?.name || '-'
          }),
          onInvalidIssue: (element) => {
            console.warn('Skipping issue due to missing fields:', element.key);
          },
        });

        this.values.test = rows;
        this.hasResources = rows.length > 0;
      } catch (error) {
        console.error('Error fetching test:', error);
        this.errorMessage = 'Failed to load test. Please try again later.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};

</script>