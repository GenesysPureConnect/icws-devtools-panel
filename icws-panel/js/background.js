var connections = {};

chrome.runtime.onConnect.addListener(function (port) {
    connections[port.name] = port;

    port.postMessage({ type: 'status', data: `Port "${port.name}" is now connected` });

    port.onDisconnect.addListener(function(port) {
        delete connections[port.name];
    });
});

// Receive message from inspected page and relay to icws-panel
chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
    if ('icws-panel' in connections) {
        connections['icws-panel'].postMessage(message);
    } else {
        console.log('Got an external message but the icws-panel port is not connected');
    }
    return true;
});
