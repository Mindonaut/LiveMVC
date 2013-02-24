define(function () {
  var HttpClientView = require("HttpClientView");
  var HttpClientListView = require("HttpClientView");
  var HttpServerController = require("HttpServerController");
  var Model = require("Model");

  var model = new Model();
  //var controller = new HttpServerController(model, view);
  
  
  var clientListView = HttpClientListView('localhost', 80);
  var rootViews = clientListView.getListView('/');
  HttpServerController.new( model, rootViews);
  
});