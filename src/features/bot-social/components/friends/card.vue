<template>
  <article class="friends-hub__card" :class="{ 'is-blocked': blocked }">
    <a
      class="friends-hub__avatar-link"
      :href="profileHref"
      target="_blank"
      rel="noreferrer noopener"
      :aria-label="name"
      @click="$emit('profile-click', $event)"
    >
      <img
        v-if="friend.avatarUrl && !avatarBroken"
        class="friends-hub__avatar"
        :src="friend.avatarUrl"
        alt=""
        width="40"
        height="40"
        loading="lazy"
        decoding="async"
        @error="$emit('avatar-error')"
      >
      <span v-else class="friends-hub__avatar friends-hub__avatar--fallback" aria-hidden="true">
        {{ initials }}
      </span>
    </a>
    <div class="friends-hub__meta">
      <a
        class="friends-hub__name"
        :href="profileHref"
        target="_blank"
        rel="noreferrer noopener"
        @click="$emit('profile-click', $event)"
      >{{ name }}</a>
      <span v-if="blocked" class="friends-hub__badge friends-hub__badge--blocked">
        {{ $t('bot-social-friends-blocked') }}
      </span>
    </div>
    <div class="friends-hub__actions">
      <button
        v-if="showAccept"
        type="button"
        class="friends-hub__icon-btn friends-hub__icon-btn--accept"
        :disabled="disabled"
        :aria-label="$t('bot-social-friends-accept-aria', { name })"
        :title="$t('bot-social-friends-accept')"
        @click="$emit('accept')"
      >
        <FontAwesomeIcon icon="check-circle" aria-hidden="true"></FontAwesomeIcon>
      </button>
      <button
        type="button"
        class="friends-hub__icon-btn friends-hub__icon-btn--danger"
        :disabled="disabled"
        :aria-label="dangerAria"
        :title="dangerTitle"
        @click="$emit('danger')"
      >
        <FontAwesomeIcon icon="trash" aria-hidden="true"></FontAwesomeIcon>
      </button>
    </div>
  </article>
</template>

<script>
  import {
    friendDisplayName,
    friendInitials,
    friendProfileUrl,
    isFriendBlocked,
  } from '../../utils/friend-display';

  export default {
    name: 'FriendsCard',
    props: {
      friend: { type: Object, required: true },
      avatarBroken: { type: Boolean, default: false },
      showAccept: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
      dangerAria: { type: String, required: true },
      dangerTitle: { type: String, required: true },
    },
    computed: {
      name() {
        return friendDisplayName(this.friend);
      },
      initials() {
        return friendInitials(this.friend);
      },
      profileHref() {
        return friendProfileUrl(this.friend.steamId);
      },
      blocked() {
        return isFriendBlocked(this.friend);
      },
    },
  };
</script>
