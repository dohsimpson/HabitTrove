/**
 * ModalOverlay provides a dimming effect for non-modal dialogs or popovers
 * that need to appear modal (e.g., to prevent interaction with background elements).
 * It should be rendered alongside the dialog/popover it's intended to overlay for.
 * Ensure the dialog/popover has a z-index higher than this overlay (default z-40).
 */
export default function ModalOverlay() {
  return <div className="fixed inset-0 z-50 bg-black/80" />
}
