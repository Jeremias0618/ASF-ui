<template>
  <div>
    <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

    <div v-if="!activeCount" class="friends-hub__empty">
      <p>{{ emptyLabel }}</p>
    </div>
    <div v-else-if="!items.length" class="friends-hub__empty">
      <p>{{ $t('bot-social-friends-search-empty') }}</p>
      <button type="button" class="button button--link" @click="$emit('clear-filters')">
        {{ $t('bot-social-friends-clear-filters') }}
      </button>
    </div>
    <template v-else>
      <ul class="friends-hub__grid" :class="{ 'is-refreshing': refreshing }">
        <li
          v-for="friend in items"
          :key="`${panelMode}-${friend.steamId}`"
          class="friends-hub__card-wrap"
        >
          <FriendsCard
            :friend="friend"
            :avatar-broken="Boolean(brokenAvatars[friend.steamId])"
            :show-accept="panelMode === 'received'"
            :disabled="mutating"
            :danger-aria="dangerAria(friend)"
            :danger-title="dangerTitle"
            @profile-click="$emit('profile-click', friend, $event)"
            @avatar-error="$emit('avatar-error', friend.steamId)"
            @accept="$emit('accept', friend)"
            @danger="$emit('danger', friend)"
          ></FriendsCard>
        </li>
      </ul>

      <div v-if="totalPages > 1" class="friends-hub__pager">
        <button
          type="button"
          class="friends-hub__page-btn"
          :disabled="page <= 1"
          @click="$emit('update:page', page - 1)"
        >
          <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
        </button>
        <span>{{ $t('bot-social-inventory-page', { current: page, total: totalPages }) }}</span>
        <button
          type="button"
          class="friends-hub__page-btn"
          :disabled="page >= totalPages"
          @click="$emit('update:page', page + 1)"
        >
          <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
  import { friendDisplayName } from '../../utils/friend-display';
  import FriendsCard from './card.vue';

  export default {
    name: 'FriendsListPanel',
    components: { FriendsCard },
    props: {
      panelMode: { type: String, required: true },
      items: { type: Array, default: () => [] },
      activeCount: { type: Number, default: 0 },
      emptyLabel: { type: String, required: true },
      error: { type: String, default: '' },
      refreshing: { type: Boolean, default: false },
      mutating: { type: Boolean, default: false },
      brokenAvatars: { type: Object, default: () => ({}) },
      page: { type: Number, default: 1 },
      totalPages: { type: Number, default: 1 },
      dangerTitle: { type: String, required: true },
    },
    methods: {
      dangerAria(friend) {
        const name = friendDisplayName(friend);
        if (this.panelMode === 'sent') return this.$t('bot-social-friends-cancel-request-aria', { name });
        if (this.panelMode === 'received') return this.$t('bot-social-friends-decline-aria', { name });
        return this.$t('bot-social-friends-remove-aria', { name });
      },
    },
  };
</script>
