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

// Small helper to build a Steve URL safely
function withQuery(url, params) {
  const u = new URL(url, window.location.origin);

  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') {
      continue;
    }
    u.searchParams.set(k, String(v));
  }

  return u.toString();
}

async function fetchJson(url) {
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
      const link = this.eventSchema?.links?.collection;

      if (link) {
        return new URL(link, window.location.origin).toString();
      }

      return `${window.location.origin}/v1/events`;
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
      if (document.getElementById('events')) {
            document.getElementById('Recent Events ext').style.display = 'none';
      }
      else {
        document.getElementById('Recent Events ext').style.display = '';
      }
    },

    emitCountIfChanged(count) {
      if (this.lastEmittedCount === count) {
        return;
      }
      this.lastEmittedCount = count;
      this.$emit('count', count);
    },

    /**
     * This is what the table uses for server-side filtering.
     * Keep it: it improves the displayed table too.
     */
    filterEventsApi(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const res = this.resource;
      const uid = res?.metadata?.uid;
      const nsName = res?.metadata?.name;

      const field = this.isNamespace ? 'metadata.namespace' : 'involvedObject.uid';
      const value = this.isNamespace ? nsName : uid;

      if (!value) {
        return pagination;
      }

      const existing = pagination.filters.find((f) => f.fields.some((ff) => ff.field === field));

      const required = PaginationParamFilter.createSingleField({
        field,
        exact: true,
        value,
        equals: true
      });

      if (existing) {
        Object.assign(existing, required);
      } else {
        pagination.filters.push(required);
      }

      return pagination;
    },

    /**
     * Fetch events count with one  request.
     * - If UID exists, server-filter by involvedObject.uid.
     * - Else, server-filter by namespace (if namespaced), then client-filter by kind+name.
     */
    async updateEventCount() {
      try {
        const res = this.resource;
        if (!res) {
          this.emitCountIfChanged(0);
          return;
        }

        const uid = res?.metadata?.uid;
        const name = res?.metadata?.name;
        const namespace = res?.metadata?.namespace;
        const kind = (res?.kind || '').toLowerCase();

        // If you know resource is a Namespace itself, use that
        const isNamespace = this.isNamespace;

        // Request size. Events per object are usually small; 500 is safe.
        const limit = 500;

        let url;

        if (isNamespace) {
          // Namespace page: show events in that namespace
          url = withQuery(this.eventsCollectionUrl, {
            'filter': `metadata.namespace=${encodeURIComponent(name)}`,
            'limit': limit,
          });
        } else if (uid) {
          // Most reliable
          url = withQuery(this.eventsCollectionUrl, {
            'filter': `involvedObject.uid=${encodeURIComponent(uid)}`,
            'limit': limit,
          });
        } else if (namespace) {
          // Fallback: fetch events in namespace, then filter locally
          url = withQuery(this.eventsCollectionUrl, {
            'filter': `metadata.namespace=${encodeURIComponent(namespace)}`,
            'limit': limit,
          });
        } else {
          // Cluster-scoped + no UID: we can’t safely count without a broader query
          // Avoid expensive calls; just emit unknown(0)
          this.emitCountIfChanged(0);
          return;
        }

        const obj = await fetchJson(url);
        const rows = obj?.data || [];

        let count;
        if (isNamespace) {
          count = rows.length;
        } else if (uid) {
          count = rows.length;
        } else {
          // namespace fallback: filter by involvedObject.name + kind (if available)
          const filtered = rows.filter((e) => {
            const inv = e?.involvedObject;
            if (!inv) return false;

            if (name && inv.name !== name) return false;
            if (kind && (inv.kind || '').toLowerCase() !== kind) return false;

            return true;
          });

          count = filtered.length;
        }

        this.emitCountIfChanged(count);
      } catch (e) {
        // Don’t break the UI for count errors
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