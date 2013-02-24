define(function(require) {
  var EventEmitter = require("EventEmitter");

  function HtmlViewList() {
    EventEmitter.apply(this);
    this.length = 0;
  }

  HtmlViewList.prototype = Object.create(EventEmitter.prototype);

  HtmlViewList.prototype.addView = function( view ) {
    Array.prototype.push.call(this, view);
  }

  HtmlViewList.prototype.removeView = function( view ) {
    var index = Array.prototype.indexOf.call(this, view);
    Array.prototype.splice.call(this, index, 1);
    this.dispatchEvent(this.removedEvent);
  }

  HtmlViewList.prototype.destroy = function() {

  }

  return HtmlViewList;
});