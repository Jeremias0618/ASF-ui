<template>
  <main class="commands home2-page-body">
    <header class="home2-page-intro commands__intro">
      <div class="commands__intro-copy">
        <p class="home2-page-eyebrow">{{ $t('control') }}</p>
        <h1 class="home2-page-title">{{ $t('commands') }}</h1>
        <p class="home2-page-lead">{{ $t('commands-lead') }}</p>
      </div>

      <button
        type="button"
        class="commands__help-btn"
        :aria-label="$t('commands-help-open')"
        :title="$t('commands-help-open')"
        @click="helpOpen = true"
      >
        <FontAwesomeIcon icon="question" fixedWidth></FontAwesomeIcon>
      </button>
    </header>

    <div class="home2-page-panel commands__panel">
      <div ref="terminal" class="terminal commands__terminal" @click="focusInput">
        <div v-for="({ type, time, message }, i) in log" :key="i" class="terminal-message">
          <span v-if="timestamps" class="terminal-message__time timestamp">[{{ time }}]</span>
          <span class="terminal-message__sign" :class="`terminal-message__sign--${type}`" v-text="type === 'out' ? '>' : '<'"></span>
          <span class="terminal-message__content">{{ message }}</span>
        </div>
        <div class="terminal__input-wrapper commands__input-wrap">
          <span v-tooltip="$t('commands-send')" class="terminal-message__sign sign-input" @click="sendCommand">></span>
          <input
            ref="terminal-input"
            type="text"
            spellcheck="false"
            :value="command"
            enterkeyhint="enter"
            class="terminal__input"
            role="combobox"
            :aria-expanded="botPickerVisible ? 'true' : 'false'"
            aria-autocomplete="list"
            :aria-controls="botPickerListId"
            :aria-activedescendant="botPickerActiveId"
            @input="onCommandInput"
            @keydown="onTerminalKeydown"
            @keydown.ctrl.65.prevent="jumpToStart"
            @keydown.ctrl.75.prevent="removeAfterCursor"
            @keydown.ctrl.76.prevent="clearTerminal"
            @keydown.ctrl.85.prevent="deleteBeforeCursorAndJumpToStart"
          >
          <input v-model="autocompleteSuggestion" type="text" spellcheck="false" class="terminal__input terminal__input--autocomplete" tabindex="-1" aria-hidden="true">

          <CommandsBotPicker
            :visible="botPickerVisible"
            :options="botPickerOptions"
            :active-index="botHighlightIndex"
            :list-id="botPickerListId"
            @highlight="botHighlightIndex = $event"
          ></CommandsBotPicker>
        </div>
      </div>
    </div>

    <CommandsHelpModal
      :open="helpOpen"
      :commands="commandCatalog"
      @close="helpOpen = false"
    ></CommandsHelpModal>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import * as storage from '../utils/storage';
  import fetchWiki from '../utils/fetchWiki';
  import getSelectedText from '../utils/getSelectedText';
  import createVirtualDOM from '../utils/createVirtualDOM';
  import CommandsHelpModal from '../components/Commands/HelpModal.vue';
  import CommandsBotPicker from '../components/Commands/BotPicker.vue';
  import { getCommandBaseName } from '../utils/command-categories';
  import { prepareCommandForSend } from '../utils/command-bots';

  const BOT_GROUPS = ['ASF', '@ALL', '@FARMING', '@IDLE', '@OFFLINE', '@ONLINE'];
  const BOT_PICKER_LIMIT = 5;

  class CommandsCache {
    constructor(maxLength) {
      this._cache = [];
      this._maxLength = maxLength;
    }

    get length() {
      return this._cache.length;
    }

    get(index) {
      return this._cache[index] || '';
    }

    add(el) {
      if (this.get(0) === el) return;
      this._cache.unshift(el);
      this.save();
    }

    trim() {
      while (this.length > this._maxLength) this._cache.pop();
    }

    save() {
      storage.set('command-history', this._cache);
    }

    load() {
      const commandHistory = storage.get('command-history');
      if (commandHistory && Array.isArray(commandHistory)) this._cache = commandHistory;
      this.trim();
    }

    clear() {
      this._cache = [];
      storage.remove('command-history');
    }
  }

  export default {
    name: 'Commands',
    components: { CommandsHelpModal, CommandsBotPicker },
    metaInfo() {
      return {
        title: this.$t('commands'),
      };
    },
    data() {
      return {
        command: '',
        log: [],
        commandHistory: new CommandsCache(20),
        commandHistoryIndex: -1,
        asfCommands: [],
        lastTabPressTime: 0,
        helpOpen: false,
        botHighlightIndex: 0,
        botPickerListId: 'commands-bot-picker-list',
        botPickerCommitted: false,
        committedBotCommand: '',
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
        timestamps: 'settings/timestamps',
        bots: 'bots/bots',
      }),
      commands() {
        return [
          ...this.asfCommands.filter(({ command }) => command !== 'help'),
          { command: 'oa', description: this.$t('terminal-command-oa') },
          { command: 'r', description: this.$t('terminal-command-r') },
          { command: 'r^', description: this.$t('terminal-command-r-mode') },
          { command: 'sa', description: this.$t('terminal-command-sa') },
        ];
      },
      commandsNames() {
        return this.commands.map(command => command.command.split(' ')[0]).sort();
      },
      uiCommands() {
        return [
          { command: 'commands', description: this.$t('terminal-commands') },
          { command: 'help <Command>', description: this.$t('terminal-help') },
          { command: 'clear', description: this.$t('terminal-command-clear') },
          { command: 'clearhistory', description: this.$t('terminal-command-clear-history') },
        ];
      },
      commandCatalog() {
        const seen = new Set();
        const catalog = [];

        const pushUnique = (entry) => {
          const key = getCommandBaseName(entry.command).toLowerCase();
          if (!key || seen.has(key)) return;
          seen.add(key);
          catalog.push(entry);
        };

        this.uiCommands.forEach(entry => pushUnique({
          command: entry.command,
          description: entry.description,
          access: '',
          source: 'ui',
        }));

        this.asfCommands
          .filter(({ command }) => command !== 'help')
          .forEach(entry => pushUnique({
            command: entry.command,
            description: entry.description,
            access: entry.access || '',
            source: 'asf',
          }));

        [
          { command: 'oa', description: this.$t('terminal-command-oa'), access: '', source: 'alias' },
          { command: 'sa', description: this.$t('terminal-command-sa'), access: '', source: 'alias' },
          { command: 'r', description: this.$t('terminal-command-r'), access: '', source: 'alias' },
          { command: 'r^', description: this.$t('terminal-command-r-mode'), access: '', source: 'alias' },
        ].forEach(pushUnique);

        return catalog;
      },
      uiCommandsNames() {
        return this.uiCommands.map(uiCommand => uiCommand.command.split(' ')[0]).sort();
      },
      allCommands() {
        return this.commands.concat(this.uiCommands).sort();
      },
      allCommandsNames() {
        return this.commandsNames.concat(this.uiCommandsNames).sort();
      },
      allCommandsParameters() {
        return this.allCommands.map(({ command }) => command.split(' '))
          .map(([command, ...params]) => ({ command, params }))
          // eslint-disable-next-line no-return-assign, no-sequences
          .reduce((commandParameters, { command, params }) => (commandParameters[command] = params, commandParameters), {});
      },
      autocompleteSuggestion() {
        if (this.botPickerVisible) {
          const option = this.botPickerOptions[this.botHighlightIndex];
          if (!option) return;

          const value = this.botFilterQuery || '';
          if (value.toLowerCase() === option.name.toLowerCase()) return;
          if (value && !option.name.toLowerCase().startsWith(value.toLowerCase())) return;

          return this.command.replace(/./g, ' ') + option.name.slice(value.length);
        }

        if (this.suggestedCommand) return this.command.replace(/./g, ' ') + this.suggestedCommand.substr(this.command.length);

        if (this.selectedCommand) {
          if (!this.suggestedParameters || !this.suggestedParameters.length) return;

          if (this.suggestedParameterValue) {
            return [
              this.command.replace(/./g, ' ') + this.suggestedParameterValue.slice(this.currentParameterValue.length),
              ...this.suggestedParameters.slice(this.currentParameterIndex),
            ].join(' ');
          }

          const remainingParameters = this.suggestedParameters.slice((this.currentParameterValue.length) ? this.currentParameterIndex : this.currentParameterIndex - 1);
          if (!remainingParameters.length && this.currentParameter) remainingParameters.push(this.currentParameter);

          return this.command.replace(/./g, ' ')
            + ((this.currentParameterValue.length) ? ' ' : '')
            + remainingParameters.join(' ');
        }
      },
      suggestedCommand() {
        if (!this.command) return;
        return this.allCommandsNames.find(command => command.startsWith(this.command));
      },
      suggestedParameters() {
        if (this.selectedCommand && this.allCommandsParameters[this.selectedCommand]) return this.allCommandsParameters[this.selectedCommand];

        return [];
      },
      currentParameterIndex() {
        return this.command.split(' ').length - 1;
      },
      currentParameter() {
        if (!this.suggestedParameters.length) return;

        const currentParameter = this.suggestedParameters[this.currentParameterIndex - 1];
        if (currentParameter) return currentParameter;

        const lastParameter = this.suggestedParameters[this.suggestedParameters.length - 1];
        if (lastParameter.substr(-2, 1) === 's') return lastParameter;
      },
      currentParameterValue() {
        if (this.currentParameter && this.currentParameter.substr(-2, 1) === 's') {
          const currentParameterValue = this.command.split(' ')[this.currentParameterIndex].split(',');
          return currentParameterValue[currentParameterValue.length - 1];
        }

        return this.command.split(' ')[this.currentParameterIndex];
      },
      suggestedParameterValue() {
        if (!this.currentParameterValue || !this.currentParameterValue.length) return;
        if (!this.currentParameter) return;

        switch (this.currentParameter.toLowerCase()) {
          case '[bot]':
          case '[bots]':
          case '<targetbot>':
            // eslint-disable-next-line no-case-declarations
            const botGroups = ['ASF', '@ALL', '@FARMING', '@IDLE', '@OFFLINE', '@ONLINE'];

            // eslint-disable-next-line no-case-declarations
            const suggestedBot = [...this.$store.getters['bots/bots'].map(bot => bot.name), ...botGroups]
              .find(name => name.startsWith(this.currentParameterValue));

            if (suggestedBot) return suggestedBot;

            return [...this.$store.getters['bots/bots'].map(bot => bot.name), ...botGroups]
              .find(name => name.toLowerCase().startsWith(this.currentParameterValue.toLowerCase()));
          case '<command>':
            return this.allCommandsNames.find(name => name.startsWith(this.currentParameterValue));
          case '<modes>':
            if (this.selectedCommand === 'transfer') {
              return ['All', 'Background', 'Booster', 'Card', 'Emoticon', 'Foil', 'Gems', 'Unknown']
                .find(name => name.toLowerCase().startsWith(this.currentParameterValue.toLowerCase()));
            }

            if (this.selectedCommand === 'redeem^') {
              return ['FD', 'FF', 'FKMD', 'SD', 'SF', 'SI', 'SKMG', 'V']
                .find(name => name.toLowerCase().startsWith(this.currentParameterValue.toLowerCase()));
            }

            return;
          case '<type>':
            if (this.selectedCommand !== 'input') return;

            return ['DeviceID', 'Login', 'Password', 'SteamGuard', 'SteamParentalCode', 'TwoFactorAuthentication']
              .find(name => name.toLowerCase().startsWith(this.currentParameterValue.toLowerCase()));
          case '<settings>':
            if (this.selectedCommand !== 'privacy') return;

            return ['Private', 'FriendsOnly', 'Public']
              .find(name => name.toLowerCase().startsWith(this.currentParameterValue.toLowerCase()));
          // no default
        }
      },
      selectedCommand() {
        if (!this.command) return;
        return this.allCommandsNames.find(command => command === this.command.split(' ')[0]);
      },
      isBotParameter() {
        const parameter = (this.currentParameter || '').toLowerCase();
        return parameter === '[bot]' || parameter === '[bots]' || parameter === '<targetbot>';
      },
      botPickerVisible() {
        if (!(this.selectedCommand && this.isBotParameter)) return false;
        if (this.botPickerCommitted && this.command === this.committedBotCommand) return false;
        return true;
      },
      botFilterQuery() {
        if (!this.selectedCommand || !this.isBotParameter) return '';

        // Keep spaces inside bot names (e.g. "Giveaway 2") instead of splitting tokens.
        const rest = this.command.slice(this.selectedCommand.length).replace(/^\s+/, '');
        if (!rest) return '';

        if (rest.includes(',')) {
          return rest.split(',').pop().replace(/^\s+/, '');
        }

        const params = this.suggestedParameters.map(parameter => parameter.toLowerCase());
        const hasFollowUpParams = params.length > 1;

        if (hasFollowUpParams) {
          const matchedBot = [...this.bots.map(bot => bot.name), ...BOT_GROUPS]
            .sort((a, b) => b.length - a.length)
            .find((name) => {
              const lower = name.toLowerCase();
              return rest.toLowerCase() === lower || rest.toLowerCase().startsWith(`${lower} `);
            });

          if (matchedBot && rest.toLowerCase().startsWith(`${matchedBot.toLowerCase()} `)) {
            return '';
          }
        }

        return rest;
      },
      botCandidates() {
        const bots = this.bots.map(bot => ({
          name: bot.name,
          kind: 'bot',
        }));

        const groups = BOT_GROUPS.map(name => ({
          name,
          kind: 'group',
        }));

        return [...bots, ...groups];
      },
      botPickerOptions() {
        if (!this.botPickerVisible) return [];

        const query = this.botFilterQuery.toLowerCase();
        const filtered = query
          ? this.botCandidates.filter(option => option.name.toLowerCase().includes(query))
          : this.botCandidates.filter(option => option.kind === 'bot');

        const prioritized = filtered.slice().sort((a, b) => {
          if (!query && a.kind !== b.kind) return a.kind === 'bot' ? -1 : 1;
          const aStarts = query && a.name.toLowerCase().startsWith(query) ? 0 : 1;
          const bStarts = query && b.name.toLowerCase().startsWith(query) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          if (a.kind !== b.kind) return a.kind === 'bot' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        return prioritized.slice(0, BOT_PICKER_LIMIT);
      },
      botPickerActiveId() {
        if (!this.botPickerVisible || !this.botPickerOptions.length) return null;
        return `${this.botPickerListId}-option-${this.botHighlightIndex}`;
      },
    },
    watch: {
      log() {
        this.$nextTick(() => {
          this.$refs.terminal.scrollTop = Math.max(0, this.$refs.terminal.scrollHeight - this.$refs.terminal.clientHeight);
        });
      },
      botPickerOptions() {
        this.botHighlightIndex = 0;
      },
    },
    async created() {
      this.commandHistory.load();
      this.asfCommands = await this.loadCommands();
    },
    mounted() {
      this.log.push({ type: 'in', time: this.getTimestamp(), message: this.$t('commands-default') });
      this.$refs['terminal-input'].focus();
    },
    methods: {
      onCommandInput(event) {
        this.command = event.target.value;
        if (this.botPickerCommitted && this.command !== this.committedBotCommand) {
          this.botPickerCommitted = false;
          this.committedBotCommand = '';
        }
      },
      onTerminalKeydown(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.sendCommand();
          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          if (this.botPickerVisible && this.botPickerOptions.length) {
            this.selectBot(this.botPickerOptions[this.botHighlightIndex].name);
            return;
          }
          this.autocomplete();
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (this.botPickerVisible && this.botPickerOptions.length) {
            this.moveBotHighlight(1);
            return;
          }
          this.historyNext();
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (this.botPickerVisible && this.botPickerOptions.length) {
            this.moveBotHighlight(-1);
            return;
          }
          this.historyPrevious();
          return;
        }

        if (event.key === 'Escape' && this.botPickerVisible) {
          event.preventDefault();
          this.botHighlightIndex = 0;
        }
      },
      moveBotHighlight(delta) {
        const total = this.botPickerOptions.length;
        if (!total) return;
        this.botHighlightIndex = (this.botHighlightIndex + delta + total) % total;
      },
      selectBot(name) {
        if (!name || !this.selectedCommand) return;

        // Keep the readable bot name in the input; spaces are encoded only when sending.
        this.command = `${this.selectedCommand} ${name}`;
        this.botPickerCommitted = true;
        this.committedBotCommand = this.command;

        this.$nextTick(() => {
          this.moveCursorToEnd();
          this.focusInput();
        });
      },
      async sendCommand() {
        const typedCommand = this.command.trim();
        this.command = '';
        this.botPickerCommitted = false;
        this.committedBotCommand = '';

        if (!typedCommand) return;

        const botNames = this.bots.map(bot => bot.name);
        const commandToExecute = prepareCommandForSend(typedCommand, botNames);

        this.commandHistoryIndex = -1;
        this.commandHistory.add(typedCommand);

        const response = { type: 'in', time: '...', message: '...' };

        this.log.push({ type: 'out', time: this.getTimestamp(), message: typedCommand });
        this.log.push(response);

        try {
          const result = await this.executeCommand(commandToExecute);
          response.message = result.trim();
        } catch (err) {
          response.message = `Error: ${err.message}`;
        } finally {
          response.time = this.getTimestamp();
        }
      },
      async executeCommand(commandToExecute) {
        switch (commandToExecute.split(' ')[0]) {
          case 'commands':
            return this.$t('terminal-available-commands', { commands: this.commandsNames.join(', '), uiCommands: this.uiCommandsNames.join(', ') });
          case 'help':
            if (commandToExecute.split(' ')[1]) return this.commandHelp(commandToExecute.split(' ')[1]);
            return this.$t('terminal-help-text');
          case 'clear':
            // eslint-disable-next-line no-return-assign
            return this.log = [];
          case 'clearhistory':
            this.commandHistory.clear();
            return this.$t('terminal-command-cleared');
        }

        return this.$http.command(commandToExecute);
      },
      getTimestamp() {
        return new Date().toLocaleTimeString();
      },
      commandHelp(command) {
        const foundCommand = this.allCommands.find(allCommand => allCommand.command.split(' ')[0] === command);
        if (foundCommand) return foundCommand.description;
        return this.$t('terminal-no-help', { command });
      },
      focusInput() {
        const selectedText = getSelectedText();
        if (selectedText) return;
        this.$refs['terminal-input'].focus();
      },
      autocomplete() {
        if (!this.selectedCommand) this.command = this.suggestedCommand || this.command;

        if (this.selectedCommand && this.suggestedParameterValue) {
          const splitCommand = this.command.split(' ');
          const splitCurrentParameter = splitCommand[splitCommand.length - 1].split(',');

          this.command = [...splitCommand.slice(0, -1), [...splitCurrentParameter.slice(0, -1), this.suggestedParameterValue].join(',')].join(' ');
        } else if (this.command === 'oa') {
          this.command = 'owns ASF';
        } else if (this.command === 'sa') {
          this.command = 'status ASF';
        } else if (this.command === 'r') {
          this.command = 'redeem';
        } else if (this.command === 'r^') {
          this.command = 'redeem^';
        } else if (this.command === '') {
          const tabPressTime = Date.now();
          if (tabPressTime - this.lastTabPressTime <= 500) this.command = 'commands';
          this.lastTabPressTime = tabPressTime;
        }
      },
      historyPrevious() {
        if (this.commandHistoryIndex + 1 < this.commandHistory.length) {
          this.commandHistoryIndex++;
          this.command = this.commandHistory.get(this.commandHistoryIndex);
        }

        this.moveCursorToEnd();
      },
      historyNext() {
        if (this.commandHistoryIndex > 0) {
          this.commandHistoryIndex--;
          this.command = this.commandHistory.get(this.commandHistoryIndex);
        } else if (this.commandHistoryIndex === 0) {
          this.commandHistoryIndex = -1;
          this.command = '';
        }
      },
      clearTerminal() {
        this.log = [];
      },
      jumpToStart() {
        const el = this.$refs['terminal-input'];

        if (el.setSelectionRange) setTimeout(() => el.setSelectionRange(0, 0), 0);
      },
      removeAfterCursor() {
        const pos = this.$refs['terminal-input'].selectionStart;
        this.command = this.command.substr(0, pos);
      },
      removeBeforeCursor() {
        const pos = this.$refs['terminal-input'].selectionStart;
        const inputLength = this.$refs['terminal-input'].value.length;
        this.command = this.command.substr(pos, inputLength);
      },
      moveCursorToEnd() {
        const el = this.$refs['terminal-input'];
        const len = this.command.length;

        if (el.setSelectionRange) setTimeout(() => el.setSelectionRange(len, len), 0);
      },
      deleteBeforeCursorAndJumpToStart() {
        this.removeBeforeCursor();
        this.jumpToStart();
      },
      parseCommandsHTML(commandsWikiRaw) {
        const virtualDOM = createVirtualDOM(commandsWikiRaw);
        const commandsTableHTML = virtualDOM.querySelector('.markdown-heading > h2').parentElement.nextElementSibling;

        return Array.from(commandsTableHTML.querySelectorAll('tbody tr'))
          .map(tableRow => tableRow.textContent.trim().split('\n'))
          .map(([command, access, description]) => ({ command, access, description }));
      },
      async fetchCommands() {
        const { locale } = this.$i18n;
        const wiki = await fetchWiki('Commands', this.version, locale);
        const commands = this.parseCommandsHTML(wiki);

        storage.set(`cache:asf-commands:${locale}`, { timestamp: Date.now(), commands });

        return commands;
      },
      async loadCommands() {
        const { locale } = this.$i18n;
        const commandsCache = storage.get(`cache:asf-commands:${locale}`);

        if (commandsCache) {
          const { timestamp, commands } = commandsCache;
          if (timestamp > Date.now() - 6 * 60 * 60 * 1000) return commands;
        }

        return this.fetchCommands();
      },
    },
  };
</script>

<style lang="scss">
  @import '../style/scrollbar';

  .commands {
    display: grid;
    gap: 1rem;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
  }

  .commands__intro {
    align-items: flex-start;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  .commands__intro-copy {
    flex: 1;
    min-width: 0;
  }

  .commands__help-btn {
    align-items: center;
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 999px;
    color: var(--h2-muted, #667085);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    font-size: 1rem;
    height: 2.35rem;
    justify-content: center;
    margin-top: 0.15rem;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    width: 2.35rem;

    &:hover,
    &:focus-visible {
      border-color: var(--color-theme, #3b82f6);
      color: var(--color-theme, #3b82f6);
      outline: none;
    }
  }

  .commands__panel {
    background: #0f172a;
    border: 0;
    border-radius: 0.85rem;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }

  .app--dark-mode .commands__panel {
    background: #0b1220;
  }

  .commands__input-wrap {
    overflow: visible;
    position: relative;
    z-index: 2;
  }

  .commands__terminal.terminal {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    color: #e2e8f0;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    @include h2-scrollbar;
    @include h2-scrollbar-dark;

    .terminal-message__sign {
      color: #64748b;
    }

    .terminal-message__sign--in,
    .sign-input {
      color: #60a5fa;
    }

    .terminal-message__time,
    .terminal-message__process {
      color: #64748b;
    }

    .terminal__input--autocomplete {
      color: #fbbf24;
      text-shadow: 0 0 10px rgba(251, 191, 36, 0.45);
    }

    .terminal__input-wrapper .terminal-message__sign,
    .terminal__input {
      color: #e2e8f0;
    }
  }

  .app--dark-mode .commands__terminal.terminal {
    background: #0b1220;
    color: #f1f5f9;

    .terminal__input-wrapper .terminal-message__sign,
    .terminal__input {
      color: #f1f5f9;
    }

    .terminal-message__sign--in,
    .sign-input {
      color: #93c5fd;
    }

    .terminal__input--autocomplete {
      color: #fcd34d;
      text-shadow: 0 0 12px rgba(252, 211, 77, 0.5);
    }
  }

  .sign-input {
    cursor: pointer;
  }

  .timestamp {
    margin-right: 0.5em;
  }
</style>
