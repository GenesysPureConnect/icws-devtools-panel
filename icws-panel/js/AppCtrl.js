angular.module('IcwsPanel').controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    var ctrl = this;

    this.requestEntries = {};
    this.communicationEntries = [];
    this.selectedEntryIndex = -1;
    this.selectedEntry = undefined;


    this.selectEntry = (entryIndex) => {
        if (entryIndex < 0 || entryIndex >= this.communicationEntries.length) {
            entryIndex = -1;
        }
        this.selectedEntryIndex = entryIndex;
        this.selectedEntry = entryIndex < 0 ? undefined : this.communicationEntries[entryIndex];
        highlightRelatedEntries(entryIndex);
    };

    function highlightRelatedEntries(entryIndex) {
        const referenceEntry = ctrl.communicationEntries[entryIndex];

        if (!referenceEntry) {
            ctrl.communicationEntries.forEach(entry => { entry.highlight = false; });
            return;
        }

        for (let entry of ctrl.communicationEntries) {
            entry.highlight = areRelatedEntries(entry, referenceEntry);
        }
    }

    function areRelatedEntries(entry1, entry2) {
        if (entry1 === entry2) {
            return true;
        }

        if (entry1.type === 'message' && entry2.type === 'message') {
            let messageType1 = entry1.content.__type,
                messageType2 = entry2.content.__type,
                subscriptionId1 = entry1.content.subscriptionId,
                subscriptionId2 = entry2.content.subscriptionId;

            if (messageType1 === messageType2 && subscriptionId1 === subscriptionId2) {
                return true;
            }
        }

        return false;
    }

    function handleMessage(message) {
        ctrl.communicationEntries.push({
            type: 'message',
            timestamp: new Date(message.timestamp),
            resource: message.content.__type,
            content: message.content
        });
    }

    function collectRequestData(entry) {
        ctrl.sessionData.apiCallCount++;
        if (!ctrl.sessionData.sessionId) {
            let matches = /\/api\/(\w+)\/icws\/(\d+)/.exec(entry.resource);
            if (matches) {
                ctrl.sessionData.icServerName = matches[1];
                ctrl.sessionData.sessionId = matches[2];
            }
        }

        if (/\/icws\/[^\/]+\/messaging\/subscriptions\//.test(entry.resource)) {
            // TODO: right now this only tracks subscriptions since the panel has been open
            if (entry.content.verb === "DELETE") {
                ctrl.sessionData.subscriptionCount--;
            } else {
                ctrl.sessionData.subscriptionCount++;
            }
        }
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
        request.requestTimestamp = entry.timestamp;
        ctrl.communicationEntries.push(entry);
        collectRequestData(entry);
    }

    function collectResponseData(resp) {
        ctrl.sessionData.responseSize.headers += resp.size.headers;
        ctrl.sessionData.responseSize.body += resp.size.body;
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
            collectResponseData(response);
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
        if (typeof message.content === 'string') {
            message.content = JSON.parse(message.content);
        }
        if (message.type === 'status') {
            ctrl.uptime = Date.now();
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => handleMessage(message));
        } else if (message.type === 'icws-request') {
            $scope.$apply(() => handleRequest(message));
        } else if (message.type === 'icws-response') {
            $scope.$apply(() => handleResponse(message));
        }
    });

    // We can't get the request size from ICWS itself (a limitation of XmlHttpRequest)
    // So use the chrome devtools network API
    chrome.devtools.network.onRequestFinished.addListener(data => {
        const request = data.request;
        if (/\/icws\//.test(request.url)) {
            let correlationId;
            const correlationQueryParams = request.queryString.filter(q => { return q.name === 'correlationId' });
            if (correlationQueryParams.length > 0) {
                correlationId = Number(correlationQueryParams[0].value);
                let entry = ctrl.requestEntries[correlationId];
                if (entry) {
                    entry.size = {
                        headers: request.headersSize,
                        body: request.bodySize
                    };
                }
            }

            // Update the size totals
            ctrl.sessionData.requestSize.headers += request.headersSize;
            ctrl.sessionData.requestSize.body += request.bodySize;
        }
    });
}]);
