define(function ( require ) {
/**
 *
 * Event Class
 *
 * */

  function Event( eventName, options ) {
    this.eventName = eventName;
    // If there are no options passed, then return;
    if ( arguments.length < 2 ) return;
    for ( var option in options ) {
      if ( typeof this[option] !== undefined ) this[option] = options[option];
    }
  }
  // Defining default values
  Event.prototype.arguments = [];
  Event.prototype.returnValue = Object.undefined; // undefined property should return undefined
  Event.prototype.defaultCancelled = false;
  Event.prototype.propagationStopped = false;
  Event.prototype.immediatePropagationStopped = false;
  Event.prototype.defaultAction = null;
  Event.prototype.cancellable = true;
  Event.prototype.emitter = null; // must be set, or there will be an error otherwise
  Event.prototype.eventPhase = 0;
  Event.prototype.cancelDefault = function() {
    this.defaultCancelled = true;
  }
  Event.prototype.stopImmediatePropagation = function() {
    this.immediatePropagationStopped = true;
  }
  Event.prototype.stopPropagation = function() {
    this.propagationStopped = true;
  }

  function EventEmitter() {
    // Define internal properties
    Object.defineProperties(this, {
      __listeners: {
        value: {}
      }
    });
  }

  Object.defineProperties( EventEmitter.prototype, {
    addEventListener: {
      value: function (eventName, listener, useCapture) {
        var listenerType = useCapture ? "capture" : "bubble";
        // If model was not manually initialized
        if ( typeof this.__listeners === "undefined" ) EventEmitter.apply(this);
        if ( typeof this.__listeners[listenerType] === "undefined" ) this.__listeners[listenerType] = {};
        // If this eventName has not been defined, then the default action method, if present, has not been wrapped.
        if ( typeof this.__listeners[listenerType][eventName]  === "undefined" ) {
          this.__listeners[listenerType][eventName] = [];
          // If there is a method in the model with the name of the event, then that is going to become the default action
          if ( this[eventName] instanceof Function ) {
            // Getting the default action
            var defaultAction = this[eventName];
            // Creating the event
            var event = this.createEvent( eventName, { defaultAction: defaultAction, cancellable: true, emitter: this } );
            // Event must be dispatched on the emitter that it was registered in
            // Creating a method higher in the prototype chain with the same name, that will dispatch the new event wrapped original method, as default action.
            Object.defineProperty( this, eventName, {
              value: function () {
                event.arguments = arguments;
                event.timeStamp = (new Date()).valueOf();
                return this.dispatchEvent(event);
              }
            });
          }
        }
        // Registering listener
        this.__listeners[listenerType][eventName].push( listener );
        return listener;
      }
    },
    removeEventListener: {
      value: function ( eventName, listener, useCapture ) {
        var listenerType = useCapture ? "capture" : "bubble";
        if ( typeof this.__listeners === "undefined" ||
             typeof this.__listeners[listenerType] === "undefined" ||
             typeof this.__listeners[listenerType][eventName] === "undefined" ) {
               return false;
        } else {
          var listeners = this.__listeners[listenerType][eventName];
          var index = listeners.indexOf( listener );
          listeners.splice( index, 1 );
          return listener;
        }
      }
    },
    dispatchEvent: {
      value: function ( event ) {
        // The event must be dispatched to the listeners of the emitter in the prototype chain that registered it.
        var emitter = event.emitter || this;
        // console.log("attempting to dispatch event", event.eventName);
        // Dispatching event on capture phase
        if ( typeof emitter.__listeners == "undefined" ) return; // Unlikelly this condition will be reached, unless the dev is manually experimenting with this methods
        if ( typeof emitter.__listeners.capture !== "undefined" &&
             typeof emitter.__listeners.capture[event.eventName] !== "undefined" ) {
          event.phase = 0;
          var listeners = emitter.__listeners.capture[event.eventName];
          for ( var i = 0; i < listeners.length; i++ ) {
            listeners[i]( event );
            // If listener, stopped immediate propagation, then stop further listeners from receiving the event
            if ( event.immediatePropagationStopped ) {
              break;
            }
          }
        }
        // If the default action has not been cancelled
        // Calling the default action, in the context of this model, and passing the arguments registered in the event.
        if ( !event.defaultCancelled && event.defaultAction instanceof Function ) {
          event.returnValue = event.defaultAction.apply( this, event.arguments );
        }

        // If the event propagation has been stopped, then do not keep going with the next phase
        if ( event.propagationStopped ) return;

        if ( typeof emitter.__listeners.bubble !== "undefined" &&
             typeof emitter.__listeners.bubble[event.eventName] !== "undefined" ) {
          event.phase = 1;
          var listeners = emitter.__listeners.bubble[event.eventName];
          for ( var i = 0; i < listeners.length; i++ ) {
            listeners[i]( event );
            // If listener, stopped immediate propagation, then stop further listeners from receiving the event
            if ( event.immediatePropagationStopped ) {
              break;
            }
          }
        }
        // in case any of the bubbling events decided to capture and change the return value...
        return event.returnValue;
      }
    },
    createEvent: {
      value: function ( eventName, options ) {
        return new Event( eventName, options );
      }
    }
  } );

  return EventEmitter;




});