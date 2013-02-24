define(function (require) {
  var fs = require('fs');
  var path = require('path');



  var Controller = require('Controller');

  function HttpServerController(model, view) {
    this.setModel(model);
    this.setView(view);
  }


  HttpServerController.prototype = Object.create(Controller.prototype, {
    constructor: {
      value: Controller
    },
    sendFile: {
      value: function (url, request, response) {
        //TODO: retrieve file from the "assets" directory
        var filePath = '.' + url.split("?")[0];
        if (filePath == './') filePath = './index.html';

        var extname = path.extname(filePath);
        var contentTypes = {
          '.js': 'text/javascript',
          '.css': 'text/css'
        };
        var contentType = contentTypes[extname] || 'text/html';

        fs.exists(filePath, function (exists) {
          if (exists) {
            console.log("Serving file:", filePath);
            fs.readFile(filePath, function (error, content) {
              if (error) {
                response.writeHead(500);
                response.end();
              }
              else {
                response.writeHead(200, {
                  'Content-Type': contentType
                });
                response.end(content, 'utf-8');
              }
            });
          }
          else {
            console.log("File not found:", filePath);
            response.writeHead(404);
            response.end();
          }
        });
      }
    },
    uploadFile: {


    },
    call: {
      value: function (url, request, response) {
        if (this[url.action]) {
          // If the action is a method
          if (this[url.action] instanceof Function) {
            var returnValue = this[url.action].apply(this, url.pathTokens.slice(1));
            response.writeHead(200, {
              'Content-Type': 'application/json'
            });
            response.end(JSON.stringify(returnValue), 'utf-8');
            return true;
          }
        }
      }
    },
    setModel: {
      value: function (model) {
        this.listen(model, 'setProperty', function () {



        });
      }
    },
    setView: {
      value: function (httpView) {
        this.listen(httpView, 'get', function (url, request, response) {
          // If there is a controller with the same name... route there
          if (this.call(url, request, response)) {
            retrun true;
          }
          else {
            // Otherwise, send the requested file if found
            this.sendFile(url, request, response);
          }
        });
      }
    }

  });







  return HttpServerController;
});