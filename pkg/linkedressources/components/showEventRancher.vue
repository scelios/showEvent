<template>
  <div class="extension-container">
    <h3 class="mb-10">
      {{ title }}
    </h3>

    <PaginatedResourceTable
      v-if="showTable"
      :resource="EVENT"
      :schema="eventSchema"
      :api-filter="filterEventsApi"
      :use-query-params-for-simple-filtering="false"
      :headers="eventHeaders"
      :pagination-headers="paginationHeaders"
      :namespaced="false"
    />

    <div
      v-else
      class="muted"
    >
      No events found for this resource.
    </div>
  </div>
</template>

<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { MESSAGE, REASON } from '@shell/config/table-headers';
import {
  STEVE_EVENT_FIRST_SEEN,
  STEVE_EVENT_LAST_SEEN,
  STEVE_EVENT_TYPE,
  STEVE_NAME_COL
} from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';
import { EVENT, NAMESPACE } from '@shell/config/types';
import { buildApiUrlFromSelfLink } from '../../../helper/apiUrlHelpers';
import { fetchJson } from '../../../helper/fetchJson.js';

const EVENT_COUNT_LIMIT = 500;
const EVENT_NAMESPACE_FIELD = 'metadata.namespace';
const EVENT_UID_FIELD = 'involvedObject.uid';

export default {
  name: 'ShowEventRancher',
  components: { PaginatedResourceTable },

  props: {
    resource: { type: Object, required: true }
  },
  emits: ['count'],

  data() {
    const inStore = this.$store.getters['currentStore'](EVENT);
    const eventSchema = this.$store.getters[`${ inStore }/schemaFor`](EVENT);

    const paginationHeaders = eventSchema ? [
      STEVE_EVENT_LAST_SEEN,
      STEVE_EVENT_TYPE,
      REASON,
      headerFromSchemaColString('Subobject', eventSchema, this.$store.getters, true),
      headerFromSchemaColString('Source', eventSchema, this.$store.getters, true),
      MESSAGE,
      STEVE_EVENT_FIRST_SEEN,
      headerFromSchemaColString('Count', eventSchema, this.$store.getters, true),
      STEVE_NAME_COL,
    ] : [];

    return {
      EVENT,
      NAMESPACE,
      inStore,
      eventSchema,
      paginationHeaders,

      // avoid spamming emits
      lastEmittedCount: null,
    };
  },


  computed: {
    title() {
      const kind = this.resource?.kind || this.resource?.type || 'Resource';
      const name = this.resource?.metadata?.name || this.resource?.name || '';
      return `Events for ${ kind }: ${ name }`;
    },

    isNamespace() {
      return this.resource?.type === NAMESPACE || this.resource?.kind === 'Namespace';
    },

    showTable() {
      return !!this.eventSchema;
    },

    eventsCollectionUrl() {
      return buildApiUrlFromSelfLink(this.eventSchema?.links?.collection || '/v1/events');
    },
    
    eventHeaders() {
      return [
        { name: 'type',   label: this.t('tableHeaders.type'),   value: 'eventType', sort: 'eventType' },
        { name: 'reason', label: this.t('tableHeaders.reason'), value: 'reason',    sort: 'reason' },
        {
          name: 'date',
          label: this.t('tableHeaders.updated'),
          value: 'date',
          sort: 'date:desc',
          formatter: 'LiveDate',
          formatterOpts: { addSuffix: true },
          width: 125
        },
        { name: 'message', label: this.t('tableHeaders.message'), value: 'message', sort: 'message' },
      ];
    },
  },

  watch: {
    $route() {
      this.checkVisibility();
      this.updateEventCount();
    },
    // Recompute count when resource changes
    resource: {
      handler() {
        this.updateEventCount();
      },
      deep: false,
      immediate: true
    }
  },
  mounted() {
    this.checkVisibility();
    this.updateEventCount();
  },

  beforeUnmount() {
    this.$store.dispatch('cluster/forgetType', EVENT);
  },

  methods: {

    t(key) {
      return this.$store.getters['i18n/t'](key);
    },

    checkVisibility() {
      const eventsEl = document.getElementById('events');
      const extEl = document.getElementById('Recent Events ext');
      if (!eventsEl && extEl) {
        extEl.style.display = '';
        return;
      }
      if (eventsEl && extEl) {
        extEl.style.display = 'none';
      }
    },

    emitCountIfChanged(count) {
      if (this.lastEmittedCount === count) {
        return;
      }
      this.lastEmittedCount = count;
      this.$emit('count', count);
    },

    filterEventsApi(pagination) {
      const filter = this.buildEventFilter();
      if (!filter) {
        return pagination;
      }

      if (!pagination.filters) {
        pagination.filters = [];
      }

      const field = this.isNamespace ? EVENT_NAMESPACE_FIELD : EVENT_UID_FIELD;
      const existing = pagination.filters.find((f) => f.fields.some((ff) => ff.field === field));

      if (existing) {
        Object.assign(existing, filter);
      } else {
        pagination.filters.push(filter);
      }

      return pagination;
    },

    buildEventFilter() {
      const value = this.isNamespace ? this.resource?.metadata?.name : this.resource?.metadata?.uid;

      if (!value) {
        return null;
      }

      return PaginationParamFilter.createSingleField({
        field: this.isNamespace ? EVENT_NAMESPACE_FIELD : EVENT_UID_FIELD,
        exact: true,
        value,
        equals: true
      });
    },

    // Build the query for fetching events related to the resource. It will attempt to build from either UID or namespace+name, depending on what is available.
    buildEventQuery(resource) {
      if (!resource) {
        return null;
      }

      const uid = resource?.metadata?.uid;
      const name = resource?.metadata?.name;
      const namespace = resource?.metadata?.namespace;

      if (this.isNamespace) {
        console.debug('[events] building query for namespace', name);
        return {
          url: buildApiUrlFromSelfLink(this.eventsCollectionUrl, {
            filter: `${ EVENT_NAMESPACE_FIELD }=${ name }`,
            limit: EVENT_COUNT_LIMIT,
          }),
          clientFilter: null,
        };
      }

      if (uid) {
        console.debug('[events] building query using UID', { uid });
        return {
          url: buildApiUrlFromSelfLink(this.eventsCollectionUrl, {
            filter: `${ EVENT_UID_FIELD }=${ uid }`,
            limit: EVENT_COUNT_LIMIT,
          }),
          clientFilter: null,
        };
      }

      if (namespace) {
        console.debug('[events] building query using namespace and name', { namespace, name });
        return {
          url: buildApiUrlFromSelfLink(this.eventsCollectionUrl, {
            filter: `${ EVENT_NAMESPACE_FIELD }=${ namespace }`,
            limit: EVENT_COUNT_LIMIT,
          }),
          clientFilter: (event) => {
            const involvedObject = event?.involvedObject;
            if (!involvedObject) {
              return false;
            }

            const kind = (resource?.kind || '').toLowerCase();
            if (name && involvedObject.name !== name) {
              return false;
            }

            if (kind && (involvedObject.kind || '').toLowerCase() !== kind) {
              return false;
            }

            return true;
          },
        };
      }

      return null;
    },

    async fetchEventRows(query = this.buildEventQuery(this.resource)) {
      if (!query) {
        return [];
      }

      const response = await fetchJson(query.url);
      const rows = response?.data || [];

      return query.clientFilter ? rows.filter(query.clientFilter) : rows;
    },

    /**
     * Fetch the event count using the same query shape as the table.
     */
    async updateEventCount() {
      try {
        if (!this.resource) {
          this.emitCountIfChanged(0);
          return;
        }

        const query = this.buildEventQuery(this.resource);
        if (!query) {
          this.emitCountIfChanged(0);
          return;
        }

        const rows = await this.fetchEventRows(query);
        const count = rows.length;

        this.emitCountIfChanged(count);
      } catch (e) {
        console.warn('[events] failed to update count', e);
        this.emitCountIfChanged(0);
      }
    },
  }
};
</script>

<style scoped>
.extension-container {
  padding: 20px;
}
.muted {
  opacity: 0.8;
}
</style>