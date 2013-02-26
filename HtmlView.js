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
    //console.log('listening', fullSelector)
  }
  function unListenOnInsertedNode(fullSelector) {
    if ( insertedNodeCss.hasOwnProperty(fullSelector) ) {
      //console.log('unlistening', fullSelector)
      var css = insertedNodeCss[fullSelector];
      delete insertedNodeCss[fullSelector];
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
      value: function(selector, addCallback, removeCallback) {
        var elements = Array.prototype.concat.apply([], this.querySelectorAll(selector));
        for ( var i =0; i < elements.length; i++ ) {
          var element = elements[i];
          addCallback.call(element, element);
        }

        var fullSelector = this.__view ? this.__view.getFullSelector(selector) : this.getSelector() + ' '+ selector;
        listenOnInsertedNode(selector, fullSelector);
        function newElementHandler( event ) {
          var element = event.target;
          if ( selector === decodeSelector(event.animationName) ) {
            elements.push(element);
            addCallback.call(element, element);
            event.stopPropagation();
          }
        }
        this.addEventListener('animationstart', newElementHandler, true);
        this.addEventListener('MSAnimationStart', newElementHandler, true);
        this.addEventListener('webkitAnimationStart', newElementHandler, true);
        // Metho to watch weather the nodes had been deleted, or if this element is no longer part of the document...
        function watchInsertedNodes() {
          // If this node is no longer appended
          if ( !this.isAppended() ) clear();
          for ( var i =0; i < elements.length; i++ ) {
            var element = elements[i];
            if ( !element.isAppended() ) {
              removeCallback && removeCallback.call(element, element);
            }
          }
        }
        //Check for removed nodes every 5 minutes to clear memory
        var intervalId = setInterval(watchInsertedNodes.bind(this), 300000)
        // Or listen to the update event
        this.addEventListener('update', watchInsertedNodes, true);

        // Returning a clearing function
        return function clear() {
          clearInterval(intervalId);
          this.removeEventListener('animationstart', newElementHandler, true);
          this.removeEventListener('MSAnimationStart', newElementHandler, true);
          this.removeEventListener('webkitAnimationStart', newElementHandler, true);
          this.removeEventListener('update', watchInsertedNodes, true);
          return unListenOnInsertedNode(fullSelector);
        }
      },
      enumerable:true
    },
    liveQuerySelector: {
      value: function(selector, callback) {
        var element = this.querySelector(selector);
        element && callback.apply(element, element);
      },
      enumerable:true
    },
    getSelector: {
      value: function() {
        var names = [];
        var element = this;
        while ( element.parentNode ) {
          var tagName = element.tagName.toLowerCase();
          if (element.id) {
            names.unshift(tagName + '#' + element.id);
            break;
          }
          else {
            if ( element instanceof HTMLBodyElement || element instanceof HTMLHtmlElement ) {
              break;
            }
            else {
              var i = element.parentNode.childNodes.length;
              while ( --i >= 0 ) {
                if ( element.parentNode.childNodes[i] === element ) {
                  names.unshift(tagName + ":nth-child(" + i + ")");
                  break;
                }
              }
            }
            element = element.parentNode;
          }
        }
        return names.join(" > ");
      },
      enumerable:true
    },
    isAppended: {
      value: function() {
        if ( this.parentNode === document ) {
          return true;
        }
        else if ( this.parentNode !== null ) {
          return this.parentNode.isAppended();
        }
        else {
          return false;
        }
      },
      enumerable:true
    },
    update: {
      value: function() {
        var updateEvent = new CustomEvent('update');
        this.dispatchEvent(updateEvent);
      },
      enumerable:true
    }
  });




  // View Class
  // Views are a place holder for HTML elements, that event out whenever an element is available for a controller to get.

  function HtmlView(element, parent) {
    Object.defineProperties(this, {
      element: {
        value: element||document.querySelector('body'),
      },
      views: {
        value: {}
      },
      parent: {
        value: parent || null
      },
      selector: {
        get: function() { return parent.selector }
      }
    });
    this.element.view = this;
  }


  HtmlView.prototype.getChildren = function (selector) {
    // Making it easy to add "<propertyName:>" formated tags
    var selector = selector.replace(/(\w+)\:/gi, '$1\\:');
    if ( !this.views[selector] ) {
      this.views[selector] = new HtmlViewList(this, selector, HtmlView);
    }
    return this.views[selector];
  }

  HtmlView.prototype.getFullSelector = function (selector) {
      return (this.parent) ? this.parent.getFullSelector() + ' ' + selector : this.element.tagName.toLowerCase() + ' ' + selector;
  }

  HtmlView.prototype.destroy = function () {
    // Destroy all viewLists
    for ( var selector in this.views ) {
      this.views[selector].destroy();
    }
    // Remove inline styles stylesheets

    // Remove inline script script elements
  }

  HtmlView.prototype.destroy = function () {
    // Destroy all viewLists
    for ( var selector in this.views ) {
      this.views[selector].destroy();
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
      eventListener.call(element, onInitEvent);
    }
  });



  return HtmlView;

});