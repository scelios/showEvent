<template>
  <div class="extension-container">
    <div v-if="isLoading">
      <i class="icon icon-spinner icon-spin" /> Loading tickets...
    </div>
    <div
      v-else-if="errorMessage"
      class="error"
    >
      {{ errorMessage }}
    </div>
  
    <div v-else-if="!hasResources">
      No tickets found for this resource.
    </div>
  
    <div v-else>
      <div
        v-if="values.tickets.length > 0"
        class="mb-20"
      >
        <h3>Tickets</h3>
        <ResourceTable
          :schema="null"
          :rows="ticketRows"
          :headers="ticketHeaders"
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
  name: 'TicketsExtension',

  components: { ResourceTable },

  props: {
    resource: { type: Object, required: true },
    labelKey: { type: String, default: 'name' }, // The key we use to get the label for Jira search, defaulting to 'name'
    projectsKey: { type: String, default: 'MTSRE' }, // The key we use to get the Jira project, defaulting to 'MTSRE'
  },

  data() {
    return {
      isLoading: false,
      errorMessage: null,
      values: {
        tickets: [],
      },
      hasResources: false

    };
  },

  computed: {
    ticketHeaders() {
      return [
        { name: 'name', label: 'Name', value: 'name', sort: ['nameSort', 'name'] },
        { name: 'state', label: 'State', value: 'state', sort: ['stateSort', 'state'] },
        { name: 'priority', label: 'priority', value: 'priority', sort: ['prioritySort', 'priority'] },
        { name: 'type', label: 'Type', value: 'type', sort: ['typeSort', 'type'] },
        { name: 'description', label: 'Description', value: 'description', sort: ['descriptionSort', 'description'] },
        { name: 'url', label: 'URL', value: 'url', sort: ['urlSort', 'url'] },
      ];
    },

    ticketRows() {
      return (this.values.tickets || []).map((ticket) => ({
        ...ticket,
        _key: ticket._key || ticket.id || ticket.url || ticket.name,
        priority: (ticket.priority || '').toLowerCase(),
        metadata: ticket.metadata || { name: ticket.name || '', namespace: '' },
        nameSort: (ticket.name || '').toLowerCase(),
        stateSort: (ticket.state || '').toLowerCase(),
        descriptionSort: (ticket.description || '').toLowerCase(),
        type: (ticket.type || '').toLowerCase(),
        urlSort: (ticket.url || '').toLowerCase(),
      }));
    }
  },

  watch: {
    resource: {
      handler() {
        this.fetchTickets();
      },
      immediate: true
    }
  },

  methods: {

    async fetchTickets() {
      this.isLoading = true;
      this.errorMessage = null;
      this.values.tickets = [];
      this.hasResources = false;

      try {
        const { rows } = await fetchJiraResources({
          resource: this.resource,
          labelKey: this.labelKey,
          buildJql: (label) => `project = ${ this.projectsKey } and labels in (${ label })`,
          baseUrl: getJiraBaseUrl(),
          token: getJiraToken(),
          shouldIncludeIssue: ({ issueTypeName }) => !['Test', 'Test Execution', 'Test Plan '].includes(issueTypeName),
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

        this.values.tickets = rows;
        this.hasResources = rows.length > 0;
      } catch (error) {
        console.error('Error fetching tickets:', error);
        this.errorMessage = 'Failed to load tickets. Please try again later.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};

</script>