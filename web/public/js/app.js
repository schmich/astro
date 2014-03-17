var app = angular.module('astro', ['ngGrid']);

app.controller('SessionCtrl', function($scope, $http) {
  $scope.sessions = [];
  $scope.activeSession = null;
  $scope.request = null;
  $scope.response = null;

  $(document).ready(function () {
    $('.split-pane').splitPane();
  });

  function onItemSelected(item, ev) {
    $scope.activeSession = item.entity;
    $scope.request = $scope.activeSession.request;
    $scope.response = $scope.activeSession.response;
  }

  $scope.gridOptions = {
    data: 'sessions',
    multiSelect: false,
    afterSelectionChange: onItemSelected,
    enableColumnResize: true,
    rowHeight: 25,
    sortInfo: {
      fields: ['id'],
      directions: ['desc']
    },
    columnDefs: [
      { displayName: '#', field: 'id', width: 40, minWidth: 40 },
      { displayName: 'Status', field: 'response.status', width: 50, cellTemplate: '<div ng-class="{ error: (row.getProperty(col.field) >= 400) || row.getProperty(\'error\'), success: row.getProperty(col.field) >= 200 && row.getProperty(col.field) < 300, redirect: row.getProperty(col.field) >= 300 && row.getProperty(col.field) < 400 }"><div class="ngCellText">{{row.getProperty(\'error\') ? "ERR" : row.getProperty(col.field)}}</div></div>' },
      { displayName: 'Method', field: 'request.method', width: 60 },
      { displayName: 'Host', field: 'request.urlParts.host', width: 150 },
      { displayName: 'Path', field: 'request.urlParts.path' },
      { displayName: 'Size', field: 'response.size', width: 75, cellTemplate: '<div class="size"><div class="ngCellText">{{row.getProperty(col.field) | size}}</div><div class="fill" style="width: {{((row.getProperty(col.field) || 0) / maxResponseSize) * 100}}%"></div></div>' },
      { displayName: 'Type', field: 'response.headers["content-type"]', cellFilter: 'contentType', width: 120 }
    ]
  };

  $scope.clearSessions = function() {
    $http.delete('/sessions')
      .success(function() {
        // TODO: Better way to do this?
        $scope.sessions = [];
        $scope.activeSession = null;
        $scope.request = null;
        $scope.response = null;
      })
      .error(function() {
      });
  };

  function urlParts(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return {
      protocol: parser.protocol,
      host: parser.hostname,
      port: parser.port,
      path: parser.pathname,
      query: parser.search,
      fragment: parser.hash
    };
  }

  $scope.maxResponseSize = 0;

  function updateMaxSize() {
    var max = 0;
    angular.forEach($scope.sessions, function(session) {
      if (session.response && session.response.size > max) {
        max = session.response.size;
      }
    });
    $scope.maxResponseSize = max;
  }

  $http.get('/sessions')
    .success(function(data) {
      $scope.sessions = data;
      angular.forEach($scope.sessions, function(session) {
        session.request.urlParts = urlParts(session.request.url);
      });
      updateMaxSize();
    })
    .error(function(data) {
    });
    
  var client = new Faye.Client('/stream');
  var subscription = client.subscribe('/sessions', function(message) {
    $scope.$apply(function() {
      var session = message;
      session.request.urlParts = urlParts(session.request.url);

      if ($scope.sessions[session.id]) {
        for (var key in session) {
          $scope.sessions[session.id][key] = session[key];
        }
      } else {
        $scope.sessions[session.id] = session;
      }

      updateMaxSize();
    });
  });
});

app.controller('RequestLoadCtrl', function($scope, $http, $element) {
  var id = $element[0].dataset.id;
  $scope.request = null;

  $http.get('/sessions/' + id)
    .success(function(data) {
      $scope.request = data.request;
    })
    .error(function(data) {
    });
});

function headerCase(name) {
  return name.replace(/\b(.)/g, function(m) {
    return m.toUpperCase();
  });
}

app.controller('RequestCtrl', function($scope, $http, $sce) {
  $scope.view = 'summary';

  $scope.setView = function(view) {
    $scope.view = view;
  };

  $scope.headers = [];

  $scope.contentUrl = null;
  $scope.$watch('activeSession', function(session) {
    $scope.contentUrl = $sce.trustAsResourceUrl('/request/' + session.id + '/content');
  });

  $scope.$watch('request', function(request) {
    $scope.headers = [];
    for (var key in request.headers) {
      $scope.headers.push({
        key: headerCase(key),
        value: request.headers[key]
      });
    }
  });

  $scope.gridOptions = {
    data: 'headers',
    multiSelect: false,
    enableColumnResize: true,
    headerRowHeight: 0,
    enableRowSelection: false,
    columnDefs: [
      { field: 'key', width: '25%' },
      { field: 'value', width: '*' }
    ]
  };
});

app.controller('ResponseCtrl', function($scope, $http, $sce) {
  $scope.view = 'summary';

  $scope.setView = function(view) {
    $scope.view = view;
  };

  $scope.contentUrl = null;
  $scope.$watch('activeSession', function(session) {
    $scope.contentUrl = $sce.trustAsResourceUrl('/response/' + session.id + '/content');
  });

  $scope.headers = [];

  $scope.edit = function(id) {
    $http.post('/edit/' + id)
      .error(function(data) {
      });
  };

  $scope.statusText = function(statusCode) {
    return STATUS_CODES[statusCode];
  };

  $scope.$watch('response', function(response) {
    $scope.headers = [];
    for (var key in response.headers) {
      $scope.headers.push({
        key: headerCase(key),
        value: response.headers[key]
      });
    }
  });

  $scope.gridOptions = {
    data: 'headers',
    multiSelect: false,
    enableColumnResize: true,
    headerRowHeight: 0,
    enableRowSelection: false,
    columnDefs: [
      { field: 'key', width: '25%' },
      { field: 'value', width: '*' }
    ]
  };
});

app.filter('contentType', function() {
  return function(contentType) {
    if (!contentType)
      return '';

    return contentType.replace(/;.*/, '');
  };
});

app.filter('size', function() {
  return function(bytes) {
    if (bytes > 1000000) {
      return (bytes / 1000000).toFixed(0) + 'M';
    } else if (bytes > 1000) {
      return (bytes / 1000).toFixed(0) + 'K';
    } else if (bytes > 0) {
      return bytes + 'B';
    } else {
      return '0';
    }
  };
});
