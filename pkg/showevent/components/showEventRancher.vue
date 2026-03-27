<template>
  <div class="extension-container">
    <h3 class="mb-10">
      {{ title }}
    </h3>
  
    <PaginatedResourceTable
      v-if="showTable"
      :schema="eventSchema"
      :local-filter="filterEventsLocal"
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
  
  export default {
    name: 'ShowEvent',
  
    components: { PaginatedResourceTable },
  
    props: {
      resource: {
        type: Object,
        required: true
      }
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
  
      eventHeaders() {
        return [
          {
            name:  'type',
            label: this.t('tableHeaders.type'),
            value: 'eventType',
            sort:  'eventType',
          },
          {
            name:  'reason',
            label: this.t('tableHeaders.reason'),
            value: 'reason',
            sort:  'reason',
          },
          {
            name:          'date',
            label:         this.t('tableHeaders.updated'),
            value:         'date',
            sort:          'date:desc',
            formatter:     'LiveDate',
            formatterOpts: { addSuffix: true },
            width:         125
          },
          {
            name:  'message',
            label: this.t('tableHeaders.message'),
            value: 'message',
            sort:  'message',
          },
        ];
      },
    },
  
    beforeUnmount() {
      this.$store.dispatch('cluster/forgetType', EVENT);
    },
  
    methods: {
      t(key) {
        return this.$store.getters['i18n/t'](key);
      },
  
      filterEventsLocal(rows) {
        const res = this.resource;
        if (!res) {
          this.emitCountIfChanged(0);
          return [];
        }
  
        const name = res?.metadata?.name;
        const ns = res?.metadata?.namespace;
        const uid = res?.metadata?.uid;
  
        const filtered = (rows || []).filter((event) => {
          if (this.isNamespace) {
            return event.metadata?.namespace === name || event.involvedObject?.name === name;
          }
  
          if (uid && event.involvedObject?.uid) {
            return event.involvedObject.uid === uid;
          }
  
          const involved = event.involvedObject;
          if (!involved) {
            return false;
          }
  
          if (ns && involved.namespace !== ns) {
            return false;
          }
  
          return involved.name === name;
        });
  
        // Emit tab count based on what will be displayed
        this.emitCountIfChanged(filtered.length);
  
        return filtered;
      },
  
      emitCountIfChanged(count) {
        if (this.lastEmittedCount === count) {
          return;
        }
  
        this.lastEmittedCount = count;
        this.$emit('count', count);
      },
  
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
          exact:  true,
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