// link-mage background service worker (MV3).
//
// Listens for Summon triggers — the keyboard "summon" command and
// clicks on the toolbar action — and runs the same routine for both:
// resolves the Current page (the active tab in the focused window),
// injects `copy-link.js` into it via `chrome.scripting.executeScript`,
// awaits a result message from the content script, and flashes the
// toolbar icon to signal success or failure. The action click only
// fires while no `default_popup` is set in the manifest.
//
// See CONTEXT.md for terminology,
// docs/adr/0002-clipboard-via-synthetic-copy-event.md for the
// synthetic-copy-event pattern, and
// docs/adr/0003-bundled-content-script-and-transformer-pipeline.md for
// the bundled-content-script architecture.

const ACTIVE_DURATION_MS = 1_000;

const ICON_DEFAULT = { 48: "icons/icon-default.png" };
const ICON_ACTIVE = { 48: "icons/icon-active.png" };
const ICON_FAIL = { 48: "icons/icon-fail.png" };

chrome.commands.onCommand.addListener((command) => {
  if (command !== "summon") return;
  void summon();
});

chrome.action.onClicked.addListener(() => void summon());

async function summon(): Promise<void> {
  console.log("link-mage: summoning");
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (typeof tab?.id !== "number") {
    console.warn("link-mage: no active tab");
    flashIcon(ICON_FAIL);
    return;
  }

  // One-shot listener for the success bool from copy-link.js. Wired up
  // before injection so we don't miss a fast-firing message. Filtered
  // by sender.tab.id so a Summon in another tab can't satisfy this one.
  const tabId = tab.id;
  let listener: ((msg: unknown, sender: chrome.runtime.MessageSender) => void) | undefined;
  const resultPromise = new Promise<boolean>((resolve) => {
    listener = (msg, sender) => {
      if (sender.tab?.id !== tabId) return;
      if (
        typeof msg !== "object" ||
        msg === null ||
        (msg as { type?: unknown }).type !== "summon-result"
      ) {
        return;
      }
      resolve((msg as { success?: unknown }).success === true);
    };
    chrome.runtime.onMessage.addListener(listener);
  });

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["copy-link.js"],
    });
    const success = await resultPromise;
    if (success) {
      console.log("link-mage: summoned link for", tab.url);
      flashIcon(ICON_ACTIVE);
    } else {
      console.warn("link-mage: copy event did not land");
      flashIcon(ICON_FAIL);
    }
  } catch (err) {
    // Restricted pages (about:, chrome://, addons.mozilla.org, etc.)
    // reject script injection at the browser level. Expected; surface
    // via the failure icon.
    console.warn("link-mage: summon failed", err);
    flashIcon(ICON_FAIL);
  } finally {
    if (listener) chrome.runtime.onMessage.removeListener(listener);
  }
}

function flashIcon(activePath: { 48: string }): void {
  void chrome.action.setIcon({ path: activePath });
  setTimeout(() => {
    void chrome.action.setIcon({ path: ICON_DEFAULT });
  }, ACTIVE_DURATION_MS);
}
