define(function ( require ) {
  function Controller() {



  }

  Object.defineProperties( Controller.prototype, {
    listen: {
      value: function ( eventEmitter, eventName, eventListener, useCapture ) {
          if ( typeof this.__emitters == 'undefined' ) this.__emitters = [];
          // If the object is not an event listener, do nothing
          if ( typeof eventEmitter.addEventListener == "undefined" ) return;
          var listener = eventListener.bind(this);
          eventEmitter.addEventListener( eventName, listener, useCapture );
          this.__emitters.push({
            eventListener: listener,
            eventEmitter: eventEmitter,
            eventName: eventName,
            useCapture: useCapture
          });
          return listener;
      }
    },
    unListen: {
      value: function ( eventEmitter, eventName, eventListener, useCapture ) {
        for ( var i = 0; i < this.__emitters.length; i++ ) {
          var emitter = this.__emitters[i];
          if ( ( eventEmitter ? emitter.eventEmitter === eventEmitter : true )
            && ( eventName ? emitter.eventName === eventName : true )
            && ( eventListener ? emitter.eventListener === eventListener : true )
            && ( useCapture ? emitter.useCapture == useCapture : true ) ) {
              eventEmitter.removeEventListener( eventName, eventListener, useCapture );
              this.__emitters.splice(i, 1);
              break;
          }
        }
      }
    },
    unListenAll: {
      value: function () {
        while ( this.__emitters.length ) {
          var emitter = this.__emitters.pop();
          emitter.eventEmitter.removeEventListener(emitter.eventName, emitter.eventListener, emitter.useCapture);
        }
      }
    }
  });

  Controller.getController = function ( model, view ) {
    if ( model instanceof Array ) {
      return new Controller.HtmlArrayController( model, view ? view[0] : null );
    }
    else if ( model instanceof Object ) {
      return new Controller.HtmlController( model, view ? view[0] : null );
    } else {
      return new Controller.HtmlElementController( model, view ? view : null );
    }
  }

  return Controller;
});