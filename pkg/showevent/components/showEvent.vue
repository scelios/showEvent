<template>
  <div class="extension-container">
    <!-- Dynamic Title -->
    <h1>Events for {{ resourceKind }}: {{ resourceName }}</h1>
        
    <div v-if="isLoading">
      Loading events...
    </div>
        
    <div
      v-else-if="errorMessage"
      class="error"
    >
      {{ errorMessage }}
    </div>
        
    <div v-else-if="events.length === 0">
      No events found for this resource.
    </div>
    <table
      v-else
      class="event-table"
    >
      <thead>
        <tr>
          <th
            style="cursor: pointer"
            @click="sortBy('date')"
          >
            Last Seen
            <span
              class="sort-icon"
              :class="{ active: sortKey === 'date' }"
            >
              {{ sortKey === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
            </span>
          </th>
          <th
            style="cursor: pointer"
            @click="sortBy('type')"
          >
            Type
            <span
              class="sort-icon"
              :class="{ active: sortKey === 'type' }"
            >
              {{ sortKey === 'type' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
            </span>
          </th>
          <th
            style="cursor: pointer"
            @click="sortBy('reason')"
          >
            Reason
            <span
              class="sort-icon"
              :class="{ active: sortKey === 'reason' }"
            >
              {{ sortKey === 'reason' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
            </span>
          </th>
          <th
            style="cursor: pointer"
            @click="sortBy('name')"
          >
            Resource Name 
            <span
              class="sort-icon"
              :class="{ active: sortKey === 'name' }"
            >
              {{ sortKey === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
            </span>
          </th>
          <th
            style="cursor: pointer"
            @click="sortBy('description')"
          >
            Message
            <span
              class="sort-icon"
              :class="{ active: sortKey === 'description' }"
            >
              {{ sortKey === 'description' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(event, index) in sortedEvents"
          :key="event.id || index"
        >
          <td>{{ event.date }}</td>
          <td>
            <span :class="{'text-danger': event.type === 'Warning'}">
              {{ event.type }}
            </span>
          </td>
          <td>{{ event.reason }}</td>
          <td>
            <b>{{ event.kind }}</b>: {{ event.name }}
          </td>
          <td>
            <span :class="{'text-danger': event.type === 'Warning'}">
              [{{ event.reason }}]
            </span> 
            {{ event.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {

    props: {
        resource: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
            errorMessage: '',
            sortKey: 'date',
            sortOrder: 'desc',
            events: [] 
        };
    },
    computed: {
        // Helpers to get cleaner names from the prop
        resourceName() {
            return this.resource?.metadata?.name || this.resource?.name || '';
        },
        resourceNamespace() {
            return this.resource?.metadata?.namespace || this.resource?.namespace || '';
        },
        resourceKind() {
            return this.resource?.kind || this.resource?.type || '';
        },
        
        sortedEvents() {
            return this.events.slice().sort((a, b) => {
                let modifier = 1;
                if (this.sortOrder === 'desc') modifier = -1;
                
                const valA = (a[this.sortKey] || '').toString();
                const valB = (b[this.sortKey] || '').toString();

                if (valA < valB) return -1 * modifier;
                if (valA > valB) return 1 * modifier;
                return 0;
            });
        }
    },

    // Re-fetch if the user creates a new event or switches tabs
    watch: {
        resource() {
            this.fetchEvents();
        }
    },

    async mounted() {
        await this.fetchEvents();
    },

    methods: {

        async fetchEvents() {
            this.isLoading = true;
            this.errorMessage = '';
            try {
                const allEvents = await this.$store.dispatch('cluster/findAll', { type: 'event' });

                const filteredList = allEvents.filter(evt => {
                    const involved = evt.involvedObject;
                    if (!involved) return false;

                    // Special handling for Namespace events: we want to include 
                    // events that are either about the Namespace itself OR events that occur within that Namespace
                    if (this.resourceKind === 'Namespace') {
                        return (involved.namespace === this.resourceName) || 
                               (involved.kind === 'Namespace' && involved.name === this.resourceName);
                    }

                    if ((this.resourceNamespace && involved.namespace !== this.resourceNamespace)
                        || (involved.name !== this.resourceName)
                        || (involved.kind.toLowerCase() !== this.resourceKind.toLowerCase()))
                        {
                        return false;
                    }

                    return true;
                });

                this.events = filteredList.map(evt => {
                    // Convert the time to a more readable format
                    const lastSeen = evt.lastTimestamp || evt.firstTimestamp;
                    const date = lastSeen ? new Date(lastSeen).toLocaleString() : 'N/A';
                    return {
                        id: evt.id,
                        name: evt.involvedObject.name, 
                        kind: evt.involvedObject.kind,
                        description: evt.message || '',
                        reason: evt.reason || 'Info',
                        type: evt.type || 'Normal',
                        date: date
                    };
                });

            } catch (err) {
                this.errorMessage = `Error: ${err.message}`;
            } finally {
                this.isLoading = false;
            }
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortOrder = 'asc';
            }
        }
    }
};
</script>

<style scoped>
.extension-container {
    padding: 20px;
    font-family: sans-serif;
}

.error {
    color: #dc3545;
    padding: 10px;
    background: #ffe6e6;
    border-radius: 4px;
}

.text-danger {
    color: #dc3545;
    font-weight: bold;
}

.event-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
}

.event-table th, .event-table td {
    border: 1px solid #f5f7fa;
    padding: 8px;
    text-align: left;
}

.event-table th {
    background-color: #f5f7fa;
    color: #333;
}

.sort-icon {
    float: right;
    margin-left: 5px;
    color: #aeadad; /* Faint color for inactive */
    font-size: 0.8em;
}

.sort-icon.active {
    color: #333;
    font-weight: bold;
}
</style>