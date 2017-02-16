angular.module('IcwsPanel', []).controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    var ctrl = this;

    this.messages = [];

    // Create a connection to the background page
    var backgroundPageConnection = chrome.runtime.connect({
        name: 'icws-panel'
    });

    backgroundPageConnection.postMessage({
        type: 'panel-init',
        tabId: chrome.devtools.inspectedWindow.tabId
    });

    this.sessionData = {
        apiCallCount: 0,
        subscriptionCount: 0
    };

    backgroundPageConnection.onMessage.addListener(message => {
        if (message.type === 'status') {
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => this.messages.push(message));
        } else if (message.type === 'icws-request') {
            this.sessionData.apiCallCount++;
            console.log(message.content);
            if (!this.sessionData.sessionId) {
                var matches = /\/api\/(\w+)\/icws\/(\d+)/.exec(message.content.url);
                if (matches) {
                    this.sessionData.sessionId = matches[1];
                    this.sessionData.icServerName = matches[2];
                }
            }

            if (/\/icws\/[^\/]+\/messaging\/subscriptions\//.test(message.content.url)) {
                // TODO: right now this only tracks subscriptions since the panel has been open
                if (message.content.verb === "DELETE") {
                    this.sessionData.subscriptionCallCount--;
                } else {
                    this.sessionData.subscriptionCallCount++;
                }
            }
            $scope.$digest();
        } else if (message.type === 'icws-response') {

        }
    });


}]);
