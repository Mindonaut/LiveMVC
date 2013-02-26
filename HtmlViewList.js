define(function(require) {
  var EventEmitter = require("EventEmitter");

  function HtmlViewList(parent, selector, HtmlView) {
    EventEmitter.apply(this);
    this.length = 0;
    this.parent = parent;
    this.selector = selector;
    var self = this;
    this.clear = parent.element.liveQuerySelectorAll(selector, function (element) {
      // Only create if the element found is within another view, with the same selector...
      if ( element.view && element.view !== parent && element.view.views[selector] ) return;
      var view = new HtmlView(element, self);
      self.addView(view);
    }, function (element) {
      for ( var i =0; i < self.length; i++ ) {
        var view = self[i];
        if ( view.element === element  ) {
          self.removeView(view);
        }
      }
    });
  }

  HtmlViewList.prototype = Object.create(EventEmitter.prototype);

  HtmlViewList.prototype.addView = function( view ) {
    Array.prototype.push.call(this, view);
  }

  HtmlViewList.prototype.removeView = function( view ) {
    var index = Array.prototype.indexOf.call(this, view);
    Array.prototype.splice.call(this, index, 1);
  }

  HtmlViewList.prototype.getFullSelector = function( ) {
    return this.parent.getFullSelector(this.selector);
  }

  HtmlViewList.prototype.destroy = function() {
    this.removeEventListener('addView');
    this.removeEventListener('removeView');
    this.clear();
  }

  return HtmlViewList;
});