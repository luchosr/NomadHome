import "@testing-library/jest-dom/vitest";

// jsdom does not implement HTMLDialogElement.showModal/close. The stubs only toggle `open` (and fire
// `close`), so unit tests can exercise Modal behaviour. Focus containment, inert and ::backdrop are
// verified in the Playwright e2e suite against a real browser.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
