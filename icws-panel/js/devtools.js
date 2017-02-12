chrome.devtools.panels.create("ICWS", "icons/toolbarIcon.png", "panel.html");

var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function (message) {
    // Handle responses from the background page, if any
});
