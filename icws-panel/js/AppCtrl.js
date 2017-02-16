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
        subscriptionCount: 0,
        responseSize: {
            headers: 0,
            body: 0
        },
        requestSize: {
            headers: 0,
            body: 0
        }
    };

    backgroundPageConnection.onMessage.addListener(message => {
        if (message.type === 'status') {
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => this.messages.push(message));
            // TODO: get over-the-wire size?
        } else if (message.type === 'icws-request') {
            this.sessionData.apiCallCount++;
            // console.log(message.content);
            if (!this.sessionData.sessionId) {
                let matches = /\/api\/(\w+)\/icws\/(\d+)/.exec(message.content.url);
                if (matches) {
                    this.sessionData.icServerName = matches[1];
                    this.sessionData.sessionId = matches[2];
                }
            }

            if (/\/icws\/[^\/]+\/messaging\/subscriptions\//.test(message.content.url)) {
                // TODO: right now this only tracks subscriptions since the panel has been open
                if (message.content.verb === "DELETE") {
                    this.sessionData.subscriptionCount--;
                } else {
                    this.sessionData.subscriptionCount++;
                }
            }
            $scope.$digest();
        } else if (message.type === 'icws-response') {
            this.sessionData.responseSize.headers += message.content.size.headers;
            this.sessionData.responseSize.body += message.content.size.body;
            $scope.$digest();
        }
    });

    // We can't get the request size from ICWS itself (a limitation of XmlHttpRequest)
    // So use the chrome devtools network API
    chrome.devtools.network.onRequestFinished.addListener(data => {
        const request = data.request;
        if (/\/icws\//.test(request.url)) {
            this.sessionData.requestSize.headers += request.headersSize;
            this.sessionData.requestSize.body += request.bodySize;
        }
    });
}]);
