<template>
  <div class="extension-container">
    <div v-if="isLoading">
      <i class="icon icon-spinner icon-spin" /> Loading linked resources...
    </div>
  
    <div
      v-else-if="errorMessage"
      class="error"
    >
      {{ errorMessage }}
    </div>
  
    <div v-else-if="!hasResources">
      No linked resources found for this resource.
    </div>
  
    <div v-else>
      <div
        v-if="referredToByResources.length > 0"
        class="mb-20"
      >
        <h3>Referred To By</h3>
        <ResourceTable
          :schema="null"
          :rows="referredToByRows"
          :headers="headers"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="false"
          :groupable="false"
          :namespaced="true"
        >
          <template #cell:state="{ row }">
            <BadgeState :value="row" />
          </template>
  
          <template #cell:name="{ row }">
            <router-link
              v-if="row.detailLocation"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </router-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </template>
        </ResourceTable>
      </div>
  
      <div
        v-if="refersToResources.length > 0"
        class="mb-20"
      >
        <h3>Refers To</h3>
        <ResourceTable
          :schema="null"
          :rows="refersToRows"
          :headers="headers"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="false"
          :groupable="false"
          :namespaced="true"
        >
          <template #cell:state="{ row }">
            <BadgeState :value="row" />
          </template>
  
          <template #cell:name="{ row }">
            <router-link
              v-if="row.detailLocation"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </router-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </template>
        </ResourceTable>
      </div>
    </div>
  </div>
</template>
  
  
  <script>
  import { STATES_ENUM, colorForState, stateDisplay as stateDisplayFn } from '@shell/plugins/dashboard-store/resource-class';
  import { buildApiUrlFromSelfLink, getApiUrlFromBrowserUrl } from '../../../helper/apiUrlHelpers.js';
  import ResourceTable from '@shell/components/ResourceTable';
  import { BadgeState } from '@components/BadgeState';
  import { STATE, TYPE, NAME, NAMESPACE } from '@shell/config/table-headers';
  import { NAME as EXPLORER } from '@shell/config/product/explorer';
  import { sortableNumericSuffix } from '@shell/utils/sort';
  import { fetchJson } from '../../../helper/fetchJson.js';

  export default {
      name: 'LinkedResources',
      components: {
          ResourceTable,
          BadgeState
      },
      props: {
          resource: {
              type: Object,
              required: true
          },
          apiUrl: {
              type: String,
              default: ''
          }
      },
      emits: ['counts'],
      data() {
          return {
              isLoading: false,
              errorMessage: '',
              referredToByResources: [],
              refersToResources: [],
          };
      },
      computed: {
          resourceName() {
              return this.resource?.metadata?.name || this.resource?.name || '';
          },
          resourceNamespace() {
              return this.resource?.metadata?.namespace || this.resource?.namespace || '';
          },
          resourceKind() {
              return this.resource?.kind || this.resource?.type || '';
          },
          headers() {
              return [STATE, TYPE, NAME, NAMESPACE];
          },
          hasResources() {
              return this.referredToByResources.length > 0 || this.refersToResources.length > 0;
          },
          referredToByRows() {
              return this.mapResourcesToRows(this.referredToByResources);
          },
          refersToRows() {
              return this.mapResourcesToRows(this.refersToResources);
          }
      },
  
      // Re-fetch if the user creates a new event or switches tabs
      watch: {
        $route: {
          handler() {
            this.checkVisibility();
          },
          immediate: true
        },
        resource: {
          handler() {
            this.loadLinkedResources();
          },
          deep: false
        }
      },
  
      mounted() {
      this.checkVisibility();
      this.loadLinkedResources();
    },
  
      methods: {
        // if the "Related" tab is present, hide the Linked Resources tab
        checkVisibility() {
          const eventsEl = document.getElementById('related');
          const extEl = document.getElementById('Linked Resources');
          if (!eventsEl && extEl) {
            extEl.style.display = '';
            return;
          }
          if (eventsEl && extEl) {
            extEl.style.display = 'none';
          }
        },

        async fetchResourceFromApi() {
          const selfLink = this.resource?.links?.self || window.location.href;

          let url = buildApiUrlFromSelfLink(selfLink, {
            exclude: 'metadata.managedFields',
          });

          if (!url) {
            const link = getApiUrlFromBrowserUrl(window.location.href);
            if (link) {
              url = link.includes('?') ? link : `${ link }?exclude=metadata.managedFields`;
            }
          }

          if (!url) {
            throw new Error('Resource has no links.self or url; cannot build API URL reliably.');
          }

          return fetchJson(url);
        },
  
        async loadLinkedResources() {
          try {
            this.isLoading = true;
            this.errorMessage = '';
            this.referredToByResources = [];
            this.refersToResources = [];
  
            const obj = await this.fetchResourceFromApi();
            const relationships = obj?.metadata?.relationships || [];
            const { referredToBy, refersTo } = this.getRelationships(relationships);
  
            this.referredToByResources = referredToBy;
            this.refersToResources = refersTo;
            this.$emit('counts', {
              referredToBy: this.referredToByResources.length,
              refersTo: this.refersToResources.length,
            });
            console.debug('Loaded linked resources:', { referredToBy, refersTo });
          } catch (e) {
            this.errorMessage = e?.message || 'Failed to fetch linked resources.';
            this.referredToByResources = [];
            this.refersToResources = [];
          } finally {
            this.isLoading = false;
          }
        },

        parseResourceId(rawId) {
          if (!rawId) {
            return { namespace: undefined, name: '' };
          }

          const raw = String(rawId);
          const parts = raw.split('/');

          if (parts.length <= 1) {
            return { namespace: undefined, name: raw };
          }

          return {
            namespace: parts[0],
            name: parts.slice(1).join('/'),
          };
        },
  
        mapResourcesToRows(resources) {
          const cluster = this.$store.getters['clusterId'];
          const inStore = this.$store.getters['currentStore']();
  
          return (resources || []).map((r) => {
            const type = r.type;
            const id = r.id;
  
            let namespace = r.namespace;
            let name = r.name;
  
            if (!name) {
              const parsed = this.parseResourceId(id);
              namespace = namespace || parsed.namespace;
              name = parsed.name;
            }
  
            // Try to find the actual resource in the store (no network if already cached)
            const inStoreState = this.$store.getters[`${inStore}/byId`](type, id)?.state;
  
            const finalState = r.state || inStoreState || STATES_ENUM.MISSING;
            const stateColor = typeof colorForState === 'function' ? colorForState(finalState, r.error, r.transitioning) : 'text-info';
  
            const schema = this.$store.getters[`${inStore}/schemaFor`](type);
            const typeDisplay = schema ? this.$store.getters['type-map/labelFor'](schema) : type;
  
            const detailLocation = {
              name: `c-cluster-product-resource${namespace ? '-namespace' : ''}-id`,
              params: {
                product:  EXPLORER,
                cluster:  inStore === 'management' ? 'local' : cluster,
                resource: type,
                namespace,
                id: name,
              }
            };
  
            if (!detailLocation.params.namespace) {
              delete detailLocation.params.namespace;
            }
  
            return {
              type,
              id,
              metadata: { name, namespace },
  
              // for table columns
              name,
              namespace,
              typeDisplay,
  
              // state badge
              state: finalState,
              stateDisplay: typeof stateDisplayFn === 'function' ? stateDisplayFn(finalState) : String(finalState),
              stateBackground: stateColor.replace('text-', 'bg-'),
  
              // misc
              nameDisplay: name,
              nameSort: sortableNumericSuffix(name).toLowerCase(),
              _key: `${type}/${namespace || ''}/${name}`,
              detailLocation,
            };
          });
        },
  
        getRelationships(relationships) {
        const referredToBy = [];
        const refersTo = [];

        for (const r of (relationships || [])) {
            const common = {
            rel: r.rel,
            state: r.state,
            message: r.message,
            error: r.error,
            transitioning: r.transitioning,
            };

            // "Referred To By" == things that point *to* this resource => relationship has from*
            if (r.fromId && r.fromType) {
            const { namespace, name } = this.parseResourceId(r.fromId);

            referredToBy.push({
                ...common,
                type: r.fromType,
                id: r.fromId,
                namespace,
                name,
                direction: 'referredToBy',
            });
            }

            // "Refers To" == things this resource points to => relationship has to*
            if (r.toId && r.toType) {
            const { namespace, name } = this.parseResourceId(r.toId);

            refersTo.push({
                ...common,
                type: r.toType,
                id: r.toId,
                namespace,
                name,
                direction: 'refersTo',
            });
          }
        }

        return { referredToBy, refersTo };
        },
      }
  };
  
  </script>
  
  <style scoped>
  .extension-container {
      padding: 20px;
  }
  
  .error {
      color: #dc3545;
      padding: 10px;
      background: #ffe6e6;
      border-radius: 4px;
  }
  </style>