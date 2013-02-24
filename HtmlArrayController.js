define(function ( require ) {
  var Controller = require("Controller");
  var HtmlController = require("HtmlController");

  function HtmlArrayController( model, view ) {
    if ( model || view ) {
      this.initializeController( model, view );


    }
  }

  HtmlArrayController.prototype = Object.create( HtmlController.prototype );
  Object.defineProperty( HtmlArrayController.prototype, 'constructor', { value: HtmlArrayController } );

  Object.defineProperties( HtmlArrayController.prototype, {
    initializeController: {
      value: function ( model, view ) {
        Object.defineProperties(this, {
          __emitters: {
            value: [],
            writable:true
          },
          __constructed: {
            value: false,
            writable:true
          },
          __view: {
            value: null,
            writable:true
          },
          __model: {
            value: null,
            writable:true
          },
          __parentController: {
            value: null,
            writable:true
          },
          __controllers: {
            value: [],
            writable:true
          },
          __elementView: {
            value: document.createDocumentFragment(),
            writable:true
          }
        });

        // If the controller has been extended
        if ( Object.getPrototypeOf(this) !== HtmlController.prototype ) {
          // DO SOMETHING THAT CAN BE DONE WHEN EXTENDING THIS CONTROLLER, LIKE DEFINING AN item/element CONTROLLER, CONFIGURING, ETC.
        }
        if ( view  ) this.view = view;
        if ( model ) this.model = model;
      }
    },
    construct: {
      value: function( model, view ) {
        // Setting the model, an array, creates a number of elements, controllers to be exact, based on the contents of the array
        // The controllers might be defined via a getElementController function, for now, we will simply create default controllers (with default views)
        var length = model.length;
        for ( var i = 0; i < length; i++ ) {
          var elementModel = model[i];
          this.push( elementModel );
        }
      }
    },
    setModel: {
      value: function ( model ) {
        // Listening on direct property changes (including the length property)
        this.listen(model, 'setProperty', function( event ) {
            this.setProperty.apply( this, event.arguments );
        });
        // If the controller has not been constructed yet (with a view and a model), then nothing more to do
        if ( !this.__constructed ) return;
        // Getting the bigger length
        var length = ( model.length > this.__controllers.length ) ? model.length : this.__controllers.length
        // Adding/Removing/Updating sub controllers
        for ( var i = 0; i < length; i++ ) {
          // If there is a controller for that index, and a model, then update the controller
          if ( this.__controllers[i] && model[i] ) this.__controllers[i].model = model[i];
          // If there is a controller, but not a model for that index, then delete that controller
          else if ( this.__controllers[i] && !model[i] ) this.deleteProperty(i);
          // if there is no controller, but there is an index
          else if ( !this.__controllers[i] && model[i] ) this.push( model[i] );
        }
      }
    },
    setView: {
      value: function ( view ) {
        // This controller will use the contents of the view as the template for each element, and not for itself. To do this, it will move all elements into
        // a document fragment, and then clone them for each one of the items.
        // Remove old elements from element view template, if any
        while ( this.__elementView.childNodes.length ) {
          this.__elementView.removeChild( this.__elementView.lastChild );
        }
        // Adding new view elements to element view template
        while ( view.childNodes.length ) {
          this.__elementView.appendChild( view.firstChild );
        }
        // If the view has not been constructed, then there is nothing to update.
        if ( !this.__constructed ) return;
        // Setting a view for the first time, is different than setting a view after. In the first, we create All ellements
        for ( var i = 0; i < this.__controllers.length; i++ ) {
          var elementView = document.createElement('element');
          if ( this.__elementView ) elementView.appendChild( this.__elementView.cloneNode() );
          view.appendChild(elementView);
          this.__controllers[i].view = view;
        }
      }
    },
    setLength: {
      value: function( length ) {
        var currentLength = this.__controllers.length;
        // If lengths are the same, nothing to do
        if ( length === currentLength ) return;
        for ( var i = currentLength; i < length; i++ ) {
          this.push( this.model[i] )
        }
        for ( var i = currentLength; i > length; i-- ) {
          this.pop();
        }
      }
    },
    push: {
      value: function ( ) {
        if ( this.__elementView.firstChild ) {
          var elementViewTemplate = this.__elementView.firstChild;
        } else {
          var elementViewTemplate = document.createElement('element');
        }
        for ( var i = 0; i < arguments.length; i++ ) {
          var elementView = elementViewTemplate.cloneNode();
          var elementModel = arguments[i];
          var nextIndex = this.__controllers.length
          this.view.appendChild( elementView );
          var controller = Controller.getController( elementModel, elementView );
          this.__controllers.push( controller );
          this.defineProperty( nextIndex, controller );
        }
      }
    },
    pop: {
      value: function (  ) {
        var lastIndex = this.__controllers.length - 1;
        var elementView = this.view.lastChild;
        this.view.removeChild(elementView);
        var controller = this.__controllers.pop(controller);
        controller.destroy();
        this.deleteProperty(lastIndex, controller);
      }
    }
  });

  Controller.HtmlArrayController = HtmlArrayController;



  return HtmlArrayController;

});