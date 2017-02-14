var icwsPanelConnections = {};

chrome.runtime.onConnect.addListener(function (port) {
    // Listen for the special "panel-init" message from our devtools panel
    // and add its port to the map for future messaging.
    const extensionListener = function(message, sender, sendResponse) {
        if (message.type === 'panel-init') {
            icwsPanelConnections[message.tabId] = port;
            port.postMessage({ type: 'status', data: `Port "${port.name}" is now connected` });
        }
    };

    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);

        // Remove the connection from our map when it disconnects
        var tabs = Object.keys(icwsPanelConnections);
        for (let tab of tabs) {
            if (icwsPanelConnections[tab] === port) {
                delete icwsPanelConnections[tab];
            }
        }
    });
});

// Listen for runtime messages from content script and pass them through to the appropriate
// devtool panel connection (assuming that devtools panel has previously called chrome.runtime.connect()
// and issued the "panel-init" message to hook up its tab ID.
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if (sender.tab) {
        let tabId = sender.tab.id;
        if (tabId in icwsPanelConnections) {
            icwsPanelConnections[tabId].postMessage(message);
        } else {
            console.log('Received a message from an unrecognized tab ID (bg page connection was never initialized)');
        }
    } else {
        console.log('Received a message with sender.tab undefined');
    }

    return true;
});

/*
// Receive message from inspected page and relay to icws-panel
chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
    if ('icws-panel' in icwsPanelConnections) {
        icwsPanelConnections['icws-panel'].postMessage(message);
    } else {
        console.log('Got an external message but the icws-panel port is not connected');
    }
    return true;
});
*/
