define(function( require ) {
  var engine = require('engine.io');
  var http = require('http');
  var uuid = require('node-uuid');
  var Cookies = require('cookies');
  var url = require('url');
  
  
  
  function HttpClientViewList(parent, selector) {
    Object.defineProperties(this, {
      length: {
        value: 0,
        writable: true
      },
      parent: {
        value: parent
      },
      selector: {
        value: new RegExp('('+selector+')(.*)')
      }
    });
  }

  Object.defineProperties(HttpClientViewList.prototype, {
    match: {
      value: function(url) {
        var matches = url.match(this.selector);
        if ( matches === null ) {
          return null;
        }
        else {
          return matches[2];
        }
      }
    }

  });




  function HttpClientView() {
    Object.defineProperties(this, {
      views: {
        value: {}
      },
      parent: {
        value: ( arguments[0] instanceof HttpClientViewList ) ? arguments[0] : null
      },
      selector: {
        get: function() { return parent.selector }
      }
    });
    if ( typeof arguments[0] !== 'object' ) createServer.apply(this, arguments);

  }

  Object.defineProperties(HttpClientView.prototype, {
    request: {
      value: function(request, response) {
        var method = request.method;
        var url = request.url;
        // test against all sub views in order to determine who to delegate the request to
        for ( var selector in this.views ) {
          var view = this.views[selector];
          var match = view.match(url);
          if ( match !== null ) {

          }
          var pattern = new RegExp('('+selector+')(.*)');

          if ( matches !== null ) {
            this.views[selector][method](matches[2]||'', request, response)
          }
        }
        // If there were no matches, then process internally
        if ( matches === null ) {
          this.views[selector][method](url, request, response)
        }
      }
    },
    get: {
      value: function(url, request, response) {


      }
    },
    post: {
      value: function() {}
    },
    head: {
      value: function() {}
    },
    delete: {
      value: function() {}
    },
    put: {
      value: function() {}
    },
    getChildren: {
      value: function(selector) {
        var viewList = new HttpClientViewList(this, selector);


      }
    }
  });






  
  
  
  
  
  
  
  
  
  
});

/*
* A view in the server, is created every time a new client makes a request.
* The same way that a controller may be reused, it may also be reused in the server. (maybe)
*
* So, in order to keep controllers stateful, we need to create a new controller every time there is a request coming from a new client, if the request
*
*
*
*
* */

function createServer() {
  var server = http.createServer(function (request, response) {
    var method = request.method;
    var url = request.url;
    var cookies = new Cookies(request, response);
    // Determining if this is a connection from an existing client or a new one
    var sessionId = cookies.get('sessionId');
    if ( typeof sessionId == 'undefined' ) {
      sessionId = uuid.v4();
      cookies.set('sessionId', sessionId, {path:'/'});
    }

    if ( this[method] instanceof Function ) {
      this[method](url, request, response);
    }


    if ( request.url == "/favicon.ico" ) return response.end();
      //console.log('requesting ', request.url);
      var filePath = '.' + request.url.split("?")[0];
      if ( filePath == './' )
          filePath = './index.html';

      var extname = path.extname( filePath );
      var contentTypes = { '.js': 'text/javascript', '.css': 'text/css' };
      var contentType = contentTypes[extname] || 'text/html';

      fs.exists( filePath, function( exists ) {
          if ( exists ) {
              console.log("Serving file:", filePath );
              fs.readFile(filePath, function( error, content ) {
                  if ( error ) {
                      response.writeHead( 500 );
                      response.end();
                  }
                  else {
                      response.writeHead( 200, { 'Content-Type': contentType } );
                      response.end(content, 'utf-8');
                  }
              });
          }
          else {
              console.log( "File not found:", filePath );
              response.writeHead(404);
              response.end();
          }
      });
  });
  server.listen.apply(server, arguments);
}
