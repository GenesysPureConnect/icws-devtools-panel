const ICWS_JS = 'icwsjs';
const initMessageType = 'icws-chrome-devtools-panel-init';

document.body.setAttribute('data-icwspanel', '');

function __postMessageToIcwsJS(type, content) {
    window.postMessage({ type: type, source: chrome.runtime.id, target: ICWS_JS, timestamp: Date.now(), content: content }, document.origin);
}

window.addEventListener('message', function(event){
    let message = event.data;

    // Discard messages that aren't from the same frame or that we posted ourselves from this script
    if (event.source !== window || !message || message.source === chrome.runtime.id) {
        return;
    }

    // The special init message sets up communication with the page
    if (message.type === initMessageType) {
        // If we get an init message from the page (icwsjs) and it doesn't know our id yet,
        // respond back with the init message giving it our runtime ID.
        if (message.source === ICWS_JS && message.target !== chrome.runtime.id) {
            __postMessageToIcwsJS(initMessageType);
        }
    }
    // All other messages targeted to our runtime id will be passed through to the extension
    else if (message.target === chrome.runtime.id && typeof message.content === 'string') {
        chrome.runtime.sendMessage(message);
    }
});

// Try posting the init message to start with, even though the page probably isn't listening
// for it yet. Both sides will do this, so whoever is last to the party will be the initiator.
__postMessageToIcwsJS(initMessageType);
