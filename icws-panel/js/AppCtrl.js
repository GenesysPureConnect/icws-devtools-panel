angular.module('IcwsPanel', []).controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    var ctrl = this;

    this.messages = [];

    this.requests = {};

    function handleRequest(message) {
        var content = message.content;
        ctrl.requests[content.correlationId] = content;
        content.requestTimestamp = message.timestamp;
        content.state = 'pending';
    }

    function handleResponse(message) {
        var request = ctrl.requests[message.content.correlationId];
        if (request) {
            request.state = message.content.callback;
            request.status = message.content.status;
            request.responseTimestamp = message.timestamp;
            request.responseContent = message.content.content;
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
        if (message.type === 'status') {
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => this.messages.push(message));
        } else if (message.type === 'icws-request') {
            $scope.$apply(() => handleRequest(message));
        } else if (message.type === 'icws-response') {
            $scope.$apply(() => handleResponse(message));
        }
    });
}]);
