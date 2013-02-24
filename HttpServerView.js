define(function( require ) {
  var engine = require('engine.io');
  var http = require('http');
  var uuid = require('node-uuid');
  var Cookies = require('cookies');
  var url = require('url');

  // Url Class
  function Url( urlString ) {
    if ( urlString ) {
      var urlObject = url.parse( urlString, true );
      // this.hostName = urlObject.hostName;
      this.pathTokens = urlObject.pathName.split('/');
      this.action = this.pathTokens[0];
      this.pathName = urlObject.pathName;
      this.query = urlObject.query;
      this.hash = urlObject.hash;
    }
  }

  Url.prototype.fwd = function () {
    var newUrl = new Url();
    newUrl.pathTokens = this.pathTokens.slice(1);
    newUrl.pathName = newUrl.pathTokens.join('/');
    newUrl.action = newUrl.pathTokens[0];
    newUrl.query = this.query;
    newUrl.hash = this.hash;
    return newUrl;
  }

  Url.prototype.toString = function () {
    return this.pathName;
  }


  function HttpServerView( parentView ) {

  }

  HttpServerView.prototype = Object.create( {} );

  Object.defineProperties(HttpServerView.prototype, {
    load: {
      value: function( filePath ) {

      }
    },
    get: {
      value: function (  ) {
      }
    },
    post: {

    },
    put: {
      value: function ( url, data ) {

      }
    },
    delete: {
      value: function( url ) {
      }
    },
    connect: {
      value: function ( url ) {
      }
    },
    open: {
      value: function ( socket ) {
      }
    },
    close: {
      value: function ( socket ) {
      }
    },
    message: {
      value: function( message, socket ) {
      }
    },
    getChild: {
      value: function( path ) {

      }
    },
    appendView: {
      value: function( path, view ) {

      }
    },
    removeView: {
      value: function ( view ) {

      }
    }
  });





  return HttpServerView;
});

