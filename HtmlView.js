define(function(require) {
  var HtmlViewList = require("HtmlViewList");

  /**
   * Helper functions
   *
   **/

   function encodeSelector(selector) {
    return btoa(selector).replace(/=/g,'_');
  }

   function decodeSelector(encodedSelector) {
    return atob(encodedSelector.replace(/_/g,'='));
  }

  var prefixes = ['','-webkit-','-ms-','-o-','-moz-'];

  var insertedNodeCss = {};
  function listenOnInsertedNode(selector, fullSelector) {
    // if an event emmiter has been registered for this full selector before, return
    if (insertedNodeCss[fullSelector]) return;
    console.log('listening on node', selector, fullSelector)
    var encodedSelector = encodeSelector(selector);
    var rule = "";
    for ( var i = 0; i < prefixes.length; i++ ) {
      rule +='@'+prefixes[i]+"keyframes " + encodedSelector + " {\n"+"\tfrom { clip: rect(1px, auto, auto, auto); }\n\tto { clip: rect(0px, auto, auto, auto); }"+"\n}\n\n";
    }
    rule += fullSelector + " {\n";
    for ( var i = 0; i < prefixes.length; i++ ) {
      rule += "\t"+prefixes[i]+"animation-duration: 0.0001s;\n";
      rule += "\t"+prefixes[i]+"animation-name: "+ encodedSelector +";\n";
    }
    rule += "}\n";

    var css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(document.createTextNode(rule));
    // Adding it to the document
    document.querySelector("head").appendChild(css);
    // registering for later removal
    insertedNodeCss[fullSelector] = css;
  }
  function unListenOnInsertedNode(fullSelector) {
    if ( insertedNodeCss.hasOwnProperty(fullSelector) ) {
      var css = insertedNodeCss[fullSelector];
      document.querySelector("head").removeChild(css);
      return true;
    } else {
      return false;
    }
  }

//  HtmlView.addCssRule = function (selector, style) {
//    var rule = selector + ' {\n' + style + '\n}'
//    this.style.appendChild(document.createTextNode(rule));
//  }
//
//  HtmlView.removeCssRule = function( selector ) {
//    var rules = this.style.childNodes;
//    for ( var i = rules.length - 1; i >= 0; i-- ) {
//      var rule = rules[i];
//      if (  rule.data.indexOf(selector) === 0 ) {
//        this.style.removeChild(rule);
//        break;
//      }
//    }
//  }
//
//
//  HtmlView.style = document.createElement("style");
//  HtmlView.style.type = "text/css";
//  document.querySelector("head").appendChild(HtmlView.style);





  // Adding helper method to Node prototype
  Object.defineProperties( Node.prototype, {
    isDescendant: {
      value: function( element ) {
        if ( this.parentNode === null ) return false;
        else if ( this.parentNode === element  ) return true;
        else if ( this.parentNode === document.body ) return false;
        else return this.parentNode.isDescendant( element );
      }
    },
    view: {
      get: function() {
        if ( this.parentNode === null ) {
          return null;
        }
        else if ( this.parentNode.__view ) {
          return this.parentNode.__view;
        }
        else {
          return this.parentNode.view;
        }
      },
      set: function( view ) {
        this.__view = view;
      }
    },
  });
  Object.defineProperties( Element.prototype, {
    liveQuerySelectorAll: {
      value: function(selector, callback) {
        var elements = this.querySelectorAll(selector);
        for ( var i =0; i < elements.length; i++ ) {
          var element = elements[i];
          callback.call(element, element);
        }
        var fullSelector = this.__view ? this.__view.getFullSelector(selector) : this.getSelector() + ' > '+ selector;
        listenOnInsertedNode(selector, fullSelector);
        function newElementHandler( event ) {
          var element = event.target;
          if ( selector === decodeSelector(event.animationName) ) {
            callback.call(element, element);
            event.stopPropagation();
          }
        }
        this.addEventListener('animationstart', newElementHandler, true);
        this.addEventListener('MSAnimationStart', newElementHandler, true);
        this.addEventListener('webkitAnimationStart', newElementHandler, true);
        // Returning a clearing function
        return function() {
          this.addEventListener('animationstart', newElementHandler, true);
          this.addEventListener('MSAnimationStart', newElementHandler, true);
          this.addEventListener('webkitAnimationStart', newElementHandler, true);
          return HtmlView.unListenOnInsertedNode(selector);
        }
      }
    },
    liveQuerySelector: {
      value: function(selector, callback) {
        var element = this.querySelector(selector);
        element && callback.apply(element, element);
      }
    },
    getSelector: {
      value: function() {
        var names = [];
        var element = this;
        while ( element.parentNode) {
          if (element.id) {
            names.unshift('#' + element.id);
            break;
          }
          else {
            if ( element.tagName === 'html' ) {
              names.unshift(element.tagName);
            }
            else {
              var i = element.parentNode.childNodes.length;
              while ( --i >= 0 ) {
                if ( element.parentNode.childNodes[i] === element ) {
                  names.unshift(element.tagName + ":nth-child(" + i + ")");
                  break;
                }
              }
            }
            element = element.parentNode;
          }
        }
        return names.join(" > ");
      }
    }
  });


  // View Class
  // Views are a place holder for HTML elements, that event out whenever an element is available for a controller to get.

  function HtmlView(element, selector) {
    Object.defineProperties(this, {
      element: {
        value: element||document.querySelector('body'),
        configurable: true
      },
      views: {
        value: {}
      },
      clearLiveSelector: {
        value: {}
      },
      selector: {
        value: selector||'body'
      },
      newElementHandler: {
        value: this.newElement.bind(this)
      }
    });
    this.element.view = this;
  }

  HtmlView.prototype.newElement = function (event) {
    var element = event.target;
    //TODO: Handle new style tags and script tags for view scoped functionality
    var selector = HtmlView.decodeSelector(event.animationName);
    if ( this.newChildViewElement(selector, element) ) {
      event.stopPropagation();
    }
  }

  HtmlView.prototype.newChildViewElement = function (selector, element) {
    if ( this.views[selector] ) {
      var view = new HtmlView(element, this.getFullSelector(selector));
      this.views[selector].addView(view);
      return true;
    }
  }

  HtmlView.prototype.getChildren = function (selector) {
    if ( !this.views[selector] ) {
      this.views[selector] = new HtmlViewList();
      var self = this;
      var clear = this.element.liveQuerySelectorAll(selector, function (element) {
        // Only create if the element found is within another view, with the same selector...
        if ( element.view && element.view !== self && element.view.views[selector] ) return;
        var view = new HtmlView(element, self.getFullSelector(selector));
        self.views[selector].addView(view);
      });
      this.clearLiveSelector[selector] = clear;
    }
    return this.views[selector];
  }

  HtmlView.prototype.getFullSelector = function (selector) {
      return this.selector + ' > ' + selector;
  }

  HtmlView.prototype.destroy = function () {
    // Remove node insertion animation event listeners
    for ( var selector in this.clearLiveSelector ) {
      this.clearLiveSelector[selector]();
    }
    // Remove inline styles stylesheets

    // Remove inline script script elements
  }


  // Creating prototype proxy methods
  function wrapProperty(propertyName) {
    // If prototype has already been set, then skip
    if (document.body[propertyName] instanceof Function ) {
      Object.defineProperty(HtmlView.prototype, propertyName, {
        value: function () {
          if ( this.element === null ) return;
          this.element[propertyName].apply(this.element, arguments);
        },
        enumerable:true,
      });
    } else {
       Object.defineProperty(HtmlView.prototype, propertyName, {
        set: function ( value ) {
          if ( this.element === null ) return;
          return this.element[propertyName] = value;
        },
        get: function () {
          if ( this.element === null ) return;
          return this.element[propertyName];
        },
        enumerable:true
      });
    }
  }
  // Mapping HTMLElement, Element, and Node prototypes
  for ( var propertyName in document.body ) {
    if ( !HtmlView.prototype.hasOwnProperty(propertyName) ) wrapProperty(propertyName);
  }




  // Adding support for on insertion initialization of elements
  var onInitEvent = new CustomEvent('oninit');
  document.body.liveQuerySelectorAll('*[oninit]', function(element){
    var oninitAttribute = element.getAttribute('oninit');
    if ( oninitAttribute ) {
      var eventListener = new Function(oninitAttribute);
      eventListener.apply(element, onInitEvent);
    }
  });






  return HtmlView;

});