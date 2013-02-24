define(function ( require ) {
  var Controller = require("Controller");

  function HtmlElementController ( model, view ) {
    this.initializeController( model, view )
  }

  HtmlElementController.prototype = new Controller();

  Object.defineProperties( HtmlElementController.prototype, {
    initializeController: {
      value: function( model, view ) {
            Object.defineProperties(this, {
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
          }
        });
        if ( view ) this.view = view;
        if ( model ) this.model = model;
      }
    },
    setView: {
      value: function( view ) {
        this.__view = view;
        var model = this.__model;
        if ( !view || !model) return;
        if ( view.item ) {
          for ( var i = 0; i < view.length; i++ ) {
            this.updateValue( view[i], model );
          }
        }
        else {
          this.updateValue( view, model );
        }
      }
    },
    setModel: {
      value: function( model ) {
        if ( model === this.__model ) return;
        var view = this.__view;
        if ( !view || typeof model == "undefined" ) return;
        if ( view.item ) {
          for ( var i = 0; i < view.length; i++ ) {
            this.updateValue( view[i], model );
          }
        }
        else {
          this.updateValue( view, model );
        }
        this.__model = model;
      }
    },
    updateValue: {
      value: function ( view, model ) {
        // if it is a form element...
        if ( typeof view.form !== "undefined" ) {

          // For radio buttons, mark as "checked" the ones that have the same value as the model
          if ( view instanceof HTMLInputElement && view.type == "radio" && view.value == model.toString() ) {
            view.checked = true;
          // For all other input elements simply set the value property to that of the model
          } else {

            var value = model.toString();
            if ( view.value !== value ) {
              view.value = value;
            }

          }
        } else {

          view.innerText = model.toString();
        }
      }
    },
    view: {
      set: function ( view ) {
        if ( this.__view === view ) return;
        this.setView( view );
      },
      get: function () {
        return this.__view;
      }
    },
    model: {
      set: function ( model ) {
        this.setModel( model );
      },
      get: function () {
        return this.__model;
      }
    },
    destroy: {
      value: function () {
        this.__model = null;
        this.__view = null;
      }
    }

  });

  // Exporting into Controller Constructor for easy access without circular references
  Controller.HtmlElementController = HtmlElementController;

  return HtmlElementController;
});