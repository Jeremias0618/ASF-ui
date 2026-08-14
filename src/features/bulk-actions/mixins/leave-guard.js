import { hasStartedAction } from '../utils/action-session';
import { clearBulkJob, isBulkJobActive, readBulkJob } from '../utils/bulk-job-session';

/**
 * Guard in-progress multi-action flows against accidental navigation.
 * Same-action bots ↔ setup transitions are allowed without prompting
 * unless a paced bulk job is actively running.
 */
export default {
  data() {
    return {
      leaveDialogOpen: false,
      pendingRoute: null,
      allowNextNavigation: false,
      actionFinished: false,
    };
  },
  computed: {
    actionSlug() {
      return String(this.$route.params.action || '');
    },
    isFlowDirty() {
      if (this.actionFinished) return false;
      if (isBulkJobActive()) return true;
      return hasStartedAction(this.actionSlug);
    },
  },
  mounted() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  },
  beforeRouteLeave(to, from, next) {
    if (this.allowNextNavigation || this.actionFinished || !this.isFlowDirty) {
      this.allowNextNavigation = false;
      next();
      return;
    }
    // While a bulk job runs, keep the user on setup (reload recovers the modal).
    if (isBulkJobActive()) {
      this.pendingRoute = to;
      this.leaveDialogOpen = true;
      next(false);
      return;
    }
    if (this.isSameActionFlow(to, from)) {
      next();
      return;
    }
    this.pendingRoute = to;
    this.leaveDialogOpen = true;
    next(false);
  },
  methods: {
    isSameActionFlow(to, from) {
      const fromAction = String((from && from.params && from.params.action) || '');
      const toAction = String((to && to.params && to.params.action) || '');
      if (!fromAction || fromAction !== toAction) return false;
      const flowNames = new Set(['multi-action-bots', 'multi-action-setup']);
      return flowNames.has(from.name) && flowNames.has(to.name);
    },
    onBeforeUnload(event) {
      if (!this.isFlowDirty) return;
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = '';
    },
    stayOnPage() {
      this.leaveDialogOpen = false;
      this.pendingRoute = null;
    },
    confirmLeaveFlow(clearSession) {
      this.leaveDialogOpen = false;
      this.allowNextNavigation = true;
      if (isBulkJobActive()) clearBulkJob();
      if (typeof clearSession === 'function') clearSession();
      const target = this.pendingRoute;
      this.pendingRoute = null;
      if (target) {
        this.$router.push(target);
        return;
      }
      this.$router.push({ name: 'multi-action' });
    },
    markActionFinished() {
      this.actionFinished = true;
    },
    continueWithoutGuard(routeLocation) {
      this.allowNextNavigation = true;
      return this.$router.push(routeLocation);
    },
    readActiveBulkJob() {
      return readBulkJob();
    },
  },
};
