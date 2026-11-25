<template>
  <svg
    v-if="qr"
    class="qr-code"
    role="img"
    :aria-label="label"
    :viewBox="`0 0 ${qr.size} ${qr.size}`"
    shape-rendering="crispEdges"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100%" height="100%" fill="#ffffff" />
    <path :d="qr.path" fill="#000000" />
  </svg>
</template>

<script>
  import qrcode from 'qrcode-generator';

  const QUIET_ZONE = 4; // modules; the QR specification asks for at least 4

  // Rendered locally on purpose: the value is a live sign-in challenge and must never reach a third party.
  export default {
    name: 'QrCode',
    props: {
      value: { type: String, required: true },
      label: { type: String, default: '' },
    },
    computed: {
      qr() {
        try {
          const code = qrcode(0, 'M');
          code.addData(this.value);
          code.make();

          const count = code.getModuleCount();
          let path = '';

          for (let row = 0; row < count; row++) {
            let col = 0;

            while (col < count) {
              if (!code.isDark(row, col)) {
                col++;
                continue;
              }

              const start = col;
              while (col < count && code.isDark(row, col)) col++;

              path += `M${start + QUIET_ZONE} ${row + QUIET_ZONE}h${col - start}v1h-${col - start}z`;
            }
          }

          return { path, size: count + QUIET_ZONE * 2 };
        } catch (err) {
          return null;
        }
      },
    },
  };
</script>

<style lang="scss">
  .qr-code {
    border-radius: 0.5rem;
    display: block;
    height: auto;
    max-width: 100%;
    width: 15rem;
  }
</style>
