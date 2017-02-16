angular.module('IcwsPanel').controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    var ctrl = this;

    this.messages = [];
    this.communicationEntries = [];
    this.messages = [];
    this.selectedMessageIndex = -1;
    this.selectedMessage = undefined;

    this.requestEntries = {};
    this.selectMessage = (messageIndex) => {
        if (messageIndex < 0 || messageIndex > this.messages.length) {
            messageIndex = -1;
        }
        this.selectedMessageIndex = messageIndex;
        this.selectedMessage = messageIndex < 0 ? undefined : this.messages[messageIndex];
    };

    function handleMessage(message) {
        ctrl.communicationEntries.push({
            type: 'message',
            timestamp: new Date(message.timestamp),
            resource: message.content.__type,
            content: message.content
        });
    }

    function handleRequest(message) {
        var request = message.content;
        var entry = ctrl.requestEntries[request.correlationId] = {
            type: 'request',
            timestamp: new Date(message.timestamp),
            resource: request.url,
            result: 'pending',
            content: request
        };
        ctrl.communicationEntries.push(entry);
    }

    function handleResponse(message) {
        var entry = ctrl.requestEntries[message.content.correlationId];
        if (entry) {
            var request = entry.content,
                response = message.content;

            request.status = response.status;
            entry.result = response.result;
            request.responseTimestamp = new Date(message.timestamp);
            request.responseContent = response.content;
        }
    }

    // Create a connection to the background page
    var backgroundPageConnection = chrome.runtime.connect({
        name: 'icws-panel'
    });

    backgroundPageConnection.postMessage({
        type: 'panel-init',
        tabId: chrome.devtools.inspectedWindow.tabId
    });

    backgroundPageConnection.onMessage.addListener(message => {
        if (typeof message.content === 'string') {
            message.content = JSON.parse(message.content);
        }
        if (message.type === 'status') {
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => handleMessage(message));
        } else if (message.type === 'icws-request') {
            $scope.$apply(() => handleRequest(message));
        } else if (message.type === 'icws-response') {
            $scope.$apply(() => handleResponse(message));
        }
    });
}]);
