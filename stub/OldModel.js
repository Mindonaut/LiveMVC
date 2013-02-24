define(function( require ) {

  function Event(eventName, options ) {
    this.eventName = eventName;
    this.arguments =[];
    this.model = {};
    this.defaultCancelled = false;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
    this.defaultAction = options ? options.defaultAction : null;
    this.cancellable = options ? options.cancellable : true;
    this.eventPhase = 0;
  }
  Event.prototype.stopPropagation = function() {
    this.defaultCancelled = true;
  }
  Event.prototype.stopImmediatePropagation = function() {
    this.immediatePropagationStopped = true;
  }
  Event.prototype.stopPropagation = function() {
    this.propagationStopped = true;
  }


  function Model() {

  }

  Model.metaPrototype = {};

  Model.propertyDescriptors = {
    addEventListener: {
      value: function (eventName, listener, useCapture) {
        // If there is a method with the name of the eventName, then process, otherwise, there is no point on listening
        if ( this[eventName] instanceof Function ) {
          var listenerType = useCapture ? "capture" : "bubble";
          if ( typeof this.__listeners == "undefined" ) this.__listeners = {};
          if ( typeof this.__listeners[listenerType]== "undefined" ) this.__listeners[listenerType] = {}
          if ( typeof this.__listeners[listenerType][eventName]  == "undefined" ) {
            this.__listeners[listenerType][eventName] = [];
            // If this kind of listener type has not been registered, then the default action method, has not been wrapped, so we wrap it.
            // Wrapping default action method
            var defaultAction = this[eventName];
            var event = this.createEvent(eventName, {defaultAction:defaultAction, model:this.__model});
            this[eventName] = function () {
              this.event = event;
              event.args = Array.apply(this, arguments);
              event.timeStamp = (new Date()).valueOf();
              this.dispatchEvent(event);
              this.event
            };
          }
          this.__listeners[listenerType][eventName].push( listener );

          return listener;
        }
      },
      configurable: false,
      writrable: false,
      enumerable: false
    },
    removeEventListener: {
      value: function ( eventName, listener, useCapture ) {
        var listenerType = useCapture ? "capture" : "bubble";
        if ( typeof this.__listeners == "undefined" ||
             typeof this.__listeners[listenerType] == "undefined" ||
             typeof this.__listeners[listenerType][eventName] == "undefined" ) {
               return false;
        } else {
          var listeners = this.__listeners[listenerType][eventName];
          var index = listeners.indexOf( listener );
          listeners.splice( index, 1 );
          return listener;
        }
      },
      configurable: false,
      writrable: false,
      enumerable: false
    },
    dispatchEvent: {
      value: function ( event ) {
        // Dispatching event on capture phase
        if ( typeof this.__listeners == "undefined" ) return;
        if ( typeof this.__listeners.capture == "undefined" ||
             typeof this.__listeners.capture[event.eventName] == "undefined" ) {
               return false;
        } else {
          event.phase = 0;
          var listeners = this.__listeners.capture[event.eventName];
          for ( var i = 0; i < listeners.length; i++ ) {
            listeners[i]( event );
            // If listener, stopped immediate propagation, then stop further listeners from receiving the event
            if ( event.immediatePropagationStopped ) {
              break;
            }
          }
        }
        // If the event propagation has been stopped, then do not keep going with the next phase
        if ( event.propagationStopped ) return;
        if ( event.defaultAction instanceof Method ) event.defaultAction.apply(event.model, event);

        if ( typeof this.__listeners.bubble == "undefined" ||
             typeof this.__listeners.bubble[event.eventName] == "undefined" ) {
               return false;
        } else {
          event.phase = 1;
          var listeners = this.__listeners.bubble[event.eventName];
          for ( var i = 0; i < listeners.length; i++ ) {
            listeners[i]( event );
            // If listener, stopped immediate propagation, then stop further listeners from receiving the event
            if ( event.immediatePropagationStopped ) {
              break;
            }
          }
        }



      },
      configurable: false,
      writrable: false,
      enumerable: false
    },
    createEvent: {
      value: function ( eventName, options ) {
        return new Event( eventName, options );
      },
      configurable: false,
      writrable: false,
      enumerable: false
    }

  };
  Model.prototype = Object.create( Model.metaPrototype, Model.propertyDescriptors );

  return Model;
});