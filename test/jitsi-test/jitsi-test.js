const TEST_BACKGROUND =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAIAAAC6s0uzAAAAA3NCSVQICAjb4U/gAAAELElEQVR4nO3WQQ0AIBDAMMC/5+ECjiYKenbPzCwAAADg7g4AAIBnBQAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALEL7BAAAwB0HAAAAMAsAAIBZAAAAzAIAAGAWAAAAwwAAAJgFAADALP8Hc5CYJdpX9fgAAAAASUVORK5CYII=";

const elements = {
  meetingView: document.getElementById("meetingView"),
  configModal: document.getElementById("configModal"),
  configForm: document.getElementById("configForm"),
  domain: document.getElementById("domain"),
  meetingId: document.getElementById("meetingId"),
  jwtToken: document.getElementById("jwtToken"),
  meet: document.getElementById("meet"),
  activeMeetingId: document.getElementById("activeMeetingId"),
  openConfig: document.getElementById("openConfig"),
  dispose: document.getElementById("dispose"),
  toggleJwt: document.getElementById("toggleJwt"),
  toggleVbgDialog: document.getElementById("toggleVbgDialog"),
  setVbg: document.getElementById("setVbg"),
  clearVbg: document.getElementById("clearVbg"),
  statusBadge: document.getElementById("statusBadge"),
  statusText: document.getElementById("statusText"),
};

let api = null;
let externalApiScript = null;
let externalApiDomain = "";

function log(message, detail) {
  console.log(`[jitsi-test] ${message}`, detail || "");
}

function setStatus(label, message, state = "idle") {
  elements.statusBadge.textContent = label;
  elements.statusBadge.classList.toggle("is-ready", state === "ready");
  elements.statusBadge.classList.toggle("is-error", state === "error");
  elements.statusText.textContent = message;
}

function getMeetingOptions() {
  return {
    domain: elements.domain.value.trim(),
    meetingId: elements.meetingId.value.trim(),
    jwt: elements.jwtToken.value.trim(),
  };
}

function hasApi(commandName) {
  if (api) {
    return true;
  }

  setStatus("Idle", `Join a meeting before using ${commandName}.`, "error");
  return false;
}

function cleanupMeeting() {
  if (!api) {
    return;
  }

  api.dispose();
  api = null;
  elements.meet.replaceChildren();
}

function normalizeDomain(domain) {
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function loadExternalApi(domain) {
  const normalizedDomain = normalizeDomain(domain);

  if (window.JitsiMeetExternalAPI && externalApiDomain === normalizedDomain) {
    return Promise.resolve();
  }

  if (externalApiScript) {
    externalApiScript.remove();
    externalApiScript = null;
    externalApiDomain = "";
    delete window.JitsiMeetExternalAPI;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${normalizedDomain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      externalApiScript = script;
      externalApiDomain = normalizedDomain;
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${script.src}`));
    document.body.appendChild(script);
  });
}

function disposeMeeting() {
  cleanupMeeting();
  setStatus("Idle", "Meeting disposed.");
  showConfigModal();
}

function showConfigModal() {
  elements.configModal.classList.remove("is-hidden");
  elements.meetingView.classList.add("is-configuring");
}

function configureMeeting() {
  cleanupMeeting();
  setStatus("Idle", "Configure meeting settings, then open the meeting view.");
  showConfigModal();
}

function showMeetingView() {
  elements.configModal.classList.add("is-hidden");
  elements.meetingView.classList.remove("is-configuring");
}

async function joinMeeting() {
  const { domain, meetingId, jwt } = getMeetingOptions();
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain || !meetingId || !jwt) {
    setStatus("Missing", "domain, meetingId, and JWT are required before joining.", "error");
    return;
  }

  cleanupMeeting();

  showMeetingView();
  elements.activeMeetingId.textContent = `domain: ${normalizedDomain} | meetingId: ${meetingId}`;
  setStatus("Joining", "Creating Jitsi meeting...");

  try {
    await loadExternalApi(normalizedDomain);
  } catch (error) {
    log("external_api.js load failed", error);
    setStatus("Error", error.message, "error");
    showConfigModal();
    return;
  }

  api = new JitsiMeetExternalAPI(normalizedDomain, {
    roomName: meetingId,
    jwt,
    parentNode: elements.meet,
    configOverwrite: {
      prejoinConfig: { enabled: false },
      disableDeepLinking: true,
      startWithAudioMuted: false,
      startWithVideoMuted: true,
    },
    interfaceConfigOverwrite: {
      //   TOOLBAR_BUTTONS: [],
    },
  });

  api.addEventListener("videoConferenceJoined", (event) => {
    log("videoConferenceJoined", event);
    setStatus("Joined", `Connected to ${meetingId}.`, "ready");
  });

  api.addEventListener("readyToClose", () => {
    log("readyToClose");
    api = null;
    setStatus("Closed", "Meeting is ready to close.");
  });

  api.addEventListener("toolbarButtonClicked", (event) => {
    log("toolbarButtonClicked", event);
  });
}

function toggleJwtVisibility() {
  const isHidden = elements.jwtToken.type === "password";
  elements.jwtToken.type = isHidden ? "text" : "password";
  elements.toggleJwt.textContent = isHidden ? "Hide JWT" : "Show JWT";
}

function toggleVirtualBackgroundDialog() {
  if (!hasApi("the background dialog")) {
    return;
  }

  log("executeCommand toggleVirtualBackgroundDialog");
  api.executeCommand("toggleVirtualBackgroundDialog");
}

function setVirtualBackground() {
  if (!hasApi("virtual background")) {
    return;
  }

  log("setVirtualBackground true");
  api.setVirtualBackground(true, TEST_BACKGROUND);
}

function clearVirtualBackground() {
  if (!hasApi("clear background")) {
    return;
  }

  log("setVirtualBackground false");
  api.setVirtualBackground(false, "");
}

elements.configForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinMeeting();
});
elements.openConfig.addEventListener("click", configureMeeting);
elements.dispose.addEventListener("click", disposeMeeting);
elements.toggleJwt.addEventListener("click", toggleJwtVisibility);
elements.toggleVbgDialog.addEventListener(
  "click",
  toggleVirtualBackgroundDialog,
);
elements.setVbg.addEventListener("click", setVirtualBackground);
elements.clearVbg.addEventListener("click", clearVirtualBackground);
