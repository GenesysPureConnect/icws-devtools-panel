angular.module('IcwsPanel').controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    let ctrl = this;

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

    this.clear = () => {
        this.communicationEntries = [];
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

    function getShortUrl(tmpl, params) {
        let url = tmpl, hasQS = (url.indexOf('?') !== -1), tokens = url.match(/\{([^\}]+)\}/g) || [];
            tokens.forEach(function(m){
                let tkn = m.slice(1, -1);
                if (tkn in params.template) {
                    url = url.replace(m, encodeURIComponent(params.template[tkn]));
                }
            });
            Object.keys(params.query).forEach(function(q){
                let value = params.query[q];
                if (Array.isArray(value)) { value = value.join(','); }
                url += (hasQS ? '&' : '?') + encodeURIComponent(q) + '=' + encodeURIComponent(value);
                hasQS = true;
            });
        return url;
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
            let matches = /\/api\/(\w+)\/icws\/(\d+)/.exec(entry.content.url);
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
        let request = message.content;
        let entry = ctrl.requestEntries[request.correlationId] = {
            type: 'request',
            timestamp: new Date(message.timestamp),
            resource: getShortUrl(request.urlTemplate, request.params),
            result: 'pending',
            content: request
        };
        request.shortUrl = entry.resource;
        request.requestTimestamp = entry.timestamp;
        ctrl.communicationEntries.push(entry);
        collectRequestData(entry);
    }

    function collectResponseData(resp) {
        ctrl.sessionData.responseSize.headers += isNaN(parseInt(resp.size.headers)) ? 0 : resp.size.headers;
        ctrl.sessionData.responseSize.body += isNaN(parseInt(resp.size.body)) ? 0 : resp.size.headers;
    }

    function handleResponse(message) {
        let entry = ctrl.requestEntries[message.content.correlationId];
        if (entry) {
            let request = entry.content,
                response = message.content;

            request.status = response.status;
            request.result = entry.result = response.result;
            request.responseTimestamp = new Date(message.timestamp);
            request.responseContent = response.content;
            request.responseSize = response.size;
            request.duration = request.responseTimestamp.getTime() - request.requestTimestamp.getTime();
            collectResponseData(response);
        }
    }
    
    // Since Chrome 54 the themeName is accessible, for earlier versions we must
    // assume the default theme is being used.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=608869
    var theme = chrome.devtools.panels.themeName || "default";
    this.useDarkTheme = theme === 'dark';
    document.body.classList.add(theme);

    // Create a connection to the background page
    let backgroundPageConnection = chrome.runtime.connect({
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
            const correlationQueryParams = request.headers.filter(q => { return q.name === 'X-ICWS-DevTools-CorrelationId' });
            if (correlationQueryParams.length > 0) {
                correlationId = Number(correlationQueryParams[0].value);
                let entry = ctrl.requestEntries[correlationId];
                if (entry) {
                    entry.content.requestSize = {
                        headers: request.headersSize,
                        body: request.bodySize
                    };
                }
            }

            // Update the size totals
            ctrl.sessionData.requestSize.headers += isNaN(parseInt(request.headersSize)) ? 0 : request.headersSize;
            ctrl.sessionData.requestSize.body += isNaN(parseInt(request.bodySize)) ? 0 : request.bodySize;
        }
        $scope.$digest();
    });
}]);
