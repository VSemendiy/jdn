import { runContextMenu } from "./contentScripts/contextMenu/contextmenu";
import { generateXpathes } from "./contentScripts/generationData";
import { highlightOnPage } from "./contentScripts/highlight";
import { getPageData } from "./contentScripts/pageData";
import { urlListener } from "./contentScripts/urlListener";
import { getPage, predictedToConvert } from "./pageObject";
import {
  getPageId,
  insertCSS,
  runConnectedScript,
  runContentScript,
} from "./pageScriptHandlers";

/*global chrome*/

let port;
let generationScriptExists;
let documentListenersStarted;
let actionListenersStarted;
let actions;

export const clearState = () => {
  port = null;
  generationScriptExists = false;
  documentListenersStarted = false;
};

const uploadElements = (callback) => async ([{ result }]) => {
  const [payload, length] = result;
  const response = await fetch("http:localhost:5000/predict", {
    method: "POST",
    body: payload,
  });

  if (response.ok) {
    const r = await response.json();
    callback([r, length]);
  } else {
    throw new Error(response);
  }
};

const setUrlListener = (onHighlightOff) => {
  getPageId((currentTabId) =>
    chrome.tabs.onUpdated.addListener((tabId, changeinfo, tab) => {
      if (
        changeinfo &&
        changeinfo.status === "complete" &&
        currentTabId === tabId
      ) {
        clearState();
        onHighlightOff();
      }
    })
  );

  runContentScript(urlListener);
};

export const getElements = (callback) => {
  runContentScript(getPageData, uploadElements(callback));
};

export const highlightElements = (
  elements,
  successCallback,
  perception,
  errorCallback
) => {
  const setHighlight = () => {
    getPageId((tabId) =>
      chrome.tabs.sendMessage(tabId, {
        message: "SET_HIGHLIGHT",
        param: { elements, perception },
      })
    );
    successCallback();
  };

  const onSetupScript = (p) => {
    port = p;
    setHighlight();
  };

  if (!port) {
    runConnectedScript(highlightOnPage, onSetupScript, errorCallback);
  } else {
    setHighlight();
  }
};

const messageHandler = ({ message, param }) => {
  if (actions[message]) {
    console.log(message);
    actions[message](param);
  }
};

export const runDocumentListeners = (_actions) => {
  actions = _actions;

  if (actionListenersStarted) {
    // we neeed to remove old one to kill all ghosty references to old data
    chrome.runtime.onMessage.removeListener(messageHandler);
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  actionListenersStarted = true;

  if (!documentListenersStarted) {
    setUrlListener(actions["HIGHLIGHT_OFF"]);
    runContentScript(runContextMenu, () => {
      insertCSS("contextmenu.css");
    });
    documentListenersStarted = true;
  }
};

export const removeHighlightFromPage = (callback) => {
  chrome.runtime.onMessage.addListener(({ message }) => {
    if (message == "HIGHLIGHT_REMOVED") {
      callback();
    }
  });
  getPageId((tabId) =>
    chrome.tabs.sendMessage(tabId, { message: "KILL_HIGHLIGHT" })
  );
};

export const generatePageObject = (
  elements,
  perception,
  mainModel,
  onGenerated
) => {
  const onXpathGenerated = ({ xpathElements, unreachableNodes }) => {
    const elToConvert = predictedToConvert(xpathElements, perception);
    getPage(elToConvert, (page) => {
      mainModel.conversionModel.genPageCode(page, mainModel, true);
      mainModel.conversionModel.downloadPageCode(page, ".java");
      onGenerated({ unreachableNodes });
    });
  };

  const requestXpathes = () => {
    getPageId((id) =>
      chrome.tabs.sendMessage(
        id,
        { message: "GENERATE_XPATHES", param: elements },
        onXpathGenerated
      )
    );
  };

  if (!generationScriptExists) {
    runContentScript(generateXpathes, requestXpathes);
    generationScriptExists = true;
  } else {
    requestXpathes();
  }
};

export const highlightUnreached = (ids) => {
  port.postMessage({ message: "HIGHLIGHT_ERRORS", param: ids });
};
