define(function ( require ) {

  var Controller = require('Controller');
  var Model = require('Model');
  var HtmlView = require('HtmlView');
  var HtmlViewList = require('HtmlViewList');



  function HtmlController( model, view ) {
    if ( model || view ) {
      this.initializeController( model, view );
    }
  }
  HtmlController.prototype = Object.create( Controller.prototype );

  Object.defineProperties( HtmlController.prototype, {
    constructor: {
      value: HtmlController,
    },
    initializeController: {
      value: function ( model, view ) {
        Object.defineProperties(this, {
          __initialized: {
            value: false,
            writable:true
          },
          __emitters: {
            value: [],
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
            value: {},
            writable:true
          }
        });
        // If the controller has been extended
        if ( Object.getPrototypeOf(this) !== HtmlController.prototype ) {
          var propertyNames = Object.keys(this);
          // If there are properties, then it means the controller has had its subcontrollers created manually at
          // construction time via an extended controller, or by manually assigning them inline
          if ( propertyNames.length ) {
            for ( var i in propertyNames ) {
              var propertyName = propertyNames[i];
              var controller = this[propertyName];
              delete this[propertyName];
              // deleting the property from the "this" object, and let the define an equivalent sette/getter
              this.defineProperty( propertyName, controller );
            }
          }
        }
        if ( view  ) this.view = view;
        if ( model ) this.model = model;
      }
    },
    construct: {
      value: function() {

      }
    },
    defineProperty: {
      value: function ( propertyName, controller ) {
        // If the model is not a primitive value and it has a view
        if ( controller instanceof Controller ) {
          // Make sure controller passed gets intialized
          if ( !controller.hasOwnProperty('__model') ) controller.initializeController();
          controller.__parentController = this;
          // If the setter/getter has not been defined
          if ( !this[propertyName] ) {
            Object.defineProperty( this, propertyName, {
              set: function ( controller ) {
                // Destroy current controller (stop listening for model, and view events)
                var view = this.__controllers[propertyName].view;
                var model = this.__controllers[propertyName].model;
                this.__controllers[propertyName].destroy();
                this.__controllers[propertyName] = controller;
                // If controller has not been initialized manually, then do it automatically
                if ( !controller.hasOwnProperty('__model') ) {
                  controller.initializeController();
                }
                controller.__parentController = this;
                controller.view = view;
                // Only pass on the model if the controller does not have its own model
                if ( controller.model === null ) {
                  controller.model = model;
                }
              },
              get: function () {
                return this.__controllers[propertyName];
              },
              enumerable: true
            });
          }
          this.__controllers[propertyName] = controller;
        }
      }
    },
    deleteProperty: {
      value: function ( propertyName ) {
        var controller = this.__controllers[propertyName];
        delete this[propertyName];
        delete this.__controllers[propertyName];
        // Shoud we destroy the controller that we just removed? or is it possible to have the same controller in two places??
        // controller.destroy()
        return controller;
      }
    },
    setProperty: {
      value: function ( propertyName, model ) {
        if ( this.__view === null ) return;

        if (  this.__controllers.hasOwnProperty( propertyName ) ) {
          if ( this.__controllers[propertyName].model !== model ) {
            this.__controllers[propertyName].model = model;
          }
        }
        // Calling the property specific setting method (which might or might not be defined by the user)
        var setMethodName = 'set'+propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
        if ( typeof this[setMethodName] !== "undefined" && this[setMethodName] instanceof Function ) {
          this[setMethodName]( model, this.view );
        }
      }
    },
    invoke: {
      value: function( methodName, arguments ) {
        if ( this[methodName] instanceof Function ) {
          this[methodName].apply( this, arguments );
        }
      }
    },
    view: {
      set: function ( view ) {
        if ( typeof this.__emitters == "undefined" ) this.initializeController();
        if ( this.__view !== null ) {
          this.unListen( this.__view );
        } else if ( this.__view === view ) return;
        else if ( !view ) {
          this.__view = null;
          return;
        }
        this.__view = view;
        this.setView( view );
        if ( !this.__contructed && this.__model ) {
          this.construct( this.__model, view );
          this.__constructed = true;
        }
      },
      get: function () {
        return this.__view;
      }
    },
    model: {
      set: function ( model ) {
        if ( typeof this.__emitters == "undefined" ) this.initializeController();
        if ( this.__model !== null ) {
          this.unListen( this.__model );
        } else if ( this.__model === model ) return;
        else if ( !model ) {
          this.__model = null;
          return;
        }
        this.__model = model;
        this.setModel( model );
        if ( !this.__constructed && this.__view ) {
          this.construct( model, this.__view );
          this.__constructed = true;
        }
      },
      get: function () {
        return this.__model;
      }
    },
    setModel: {
      value: function ( model ) {
        // We need to listen on setProperty events, in case a model property gets updated
        this.listen(model, 'setProperty', function( event ) {
          this.setProperty.apply( this, event.arguments );
        });

        // If the base HtmlController was instantiated directly, and not extended
        // Controller properties then must be generated dynamically
        if ( Object.getPrototypeOf( this ) === HtmlController.prototype ) {
          for ( var name in model ) {
            // CHECK: Call it defineController insted of defineProperty?
            // FIX: Make sure that if the model is dynamic, that we create missing controllers, and delete current ones if model is completelly different
            // If the controllers does not already have a property controller with that name, define one
            if ( !this.__controllers.hasOwnProperty(name) ) {
              var view = this.__view.querySelectorAll( name+'\\:, *[name="'+name+'"]' );
              var controller = Controller.getController( model[name], view);
              this.defineProperty( name, controller );
            }
          }
        // However, if the controller was not instantiated directly, there might methods we want to listen to.
        } else {
          this.listen(model, 'invoke', function( event ) {
            this.invoke.apply( this, event.arguments );
          });
        }
        // Regardless, update the properties of the controller that have the same name as the model properties
        for ( var name in model ) {
            // Getting the property model to use for this property controller/element
            var propertyModel =  ( model instanceof Object ) ? model[name] || null : null;
            this.setProperty( name, propertyModel);
        }
      }
    },
    setView: {
      value: function ( view ) {
        // Listening on anchor tags for location events
        this.listen(view, 'click', function( event ) {
          var element = event.target;
          if ( element instanceof HTMLAnchorElement  ) {
            var location = element.getAttribute('href');
            // if link is relative, let's process it
            if ( !location.match(/^\w+:\/\//) ) {
              // Preventing default action, which is to navigate to the url outlined by the anchor
              event.preventDefault();
              // Checking if we can route it to an action
              var locationTokens = location.split("/");
              // if we succesfully routed the location into a controller action, we cancel the propagation
              if ( routeLocation(this, locationTokens, [this.model, this.view, this]) ) {
                event.stopPropagation();
                //console.log('Calling:', location);
              }
            }
            event.preventDefault();
            event.stopPropagation();
          }
        });

        // And since there are form elements, start listening on the change/input event
        if ( view.querySelector("*[name]") ) {
          this.listen(view, 'change', function( event ) {

            var element = event.target;
            var name = element.name;
            var value = element.value;
            if ( this.__model.hasOwnProperty( name ) && this.__model[name] !== value ) {
              this.model[name] = value;
              event.stopPropagation();
            }
          });
          this.listen( view, 'input', function( event ) {

            var element = event.target;
            var name = element.getAttribute('name');
            var value = element.value || element.innerText;
            if ( this.__model.hasOwnProperty( name ) && this.__model[name] !== value ) {
              this.model[name] = value;
              event.stopPropagation();
            }
          });
        }

        // Updating the view of the controllers
        for ( var name in this.__controllers ) {
          var controller = this.__controllers[name];
          if ( controller instanceof Controller.HtmlElementController  ) {
            // If the controller has a view and the view is a descendant of this view, the continue;
            if ( !controller.view || !( controller.view && controller.view[0] && controller.view[0].isDescendant( view ) ) ) {
              var propertyView = view.querySelectorAll( name+'\\:, *[name="'+name+'"]' );
              this.__controllers[name].view = propertyView;
            }

          } else {
            // Same as above, since thee is no need to update the view, since the view has been manually assigned
            if ( controller.view && controller.view.isDescendant( this.view ) ) continue;
            controller.view = view.querySelector( name+'\\:, fieldset[name="'+name+'"], form[name="'+name+'"]' );
          }
        }
      }
    },
    destroy: {
      value: function () {
        this.unListenAll();
        for ( var name in this.__controllers ) {
          this.__controllers[name].destroy();
        }
        this.__model = null;
        this.__view = null;
      }
    }
  });

  function routeLocation( controller, locationTokens, arguments ) {
    var action = locationTokens.shift();
    // Looking for a sub controller with the name of the first token
    if ( controller[action] instanceof HtmlController ) {
      return routeLocation( controller[action], locationTokens, arguments);
    // looking for a method with the name of the first token
    } else if ( controller[action] instanceof Function ) {
      var arguments = locationTokens.concat( arguments );
      controller[action].apply(controller, arguments);
      return true;
    // now looking in the parent controller, but only if it is not the originating controller, otherwise we would be caught on a recursive loop
    } else if ( controller.__parentController && arguments[2] !== controller.__parentController ) {
      locationTokens.unshift( action );
      return routeLocation( controller.__parentController, locationTokens, arguments );
    } else {
      return false;
    }
  }

  Controller.HtmlController = HtmlController;






  function HtmlControllerList( model, viewList ) {
    Object.defineProperties(this, {
      ControllerConstructor: {
        value: HtmlController,
        writable: true
      }
    });

    this.model = model;
    this.view = viewList;
  }


  HtmlControllerList.prototype = Object.create(Controller.prototype, {
    view: {
      // Set and get fucnctions
      set: function ( viewList ) {
        var view = viewList
        if ( this.__view !== null ) {
          this.unListen( this.__view );
        } else if ( this.__view === view ) return;
        else if ( !view ) {
          this.__view = null;
          return;
        }
        this.__view = view;
        this.setView( view );
      },
      get: function () {
        return this.__view;
      }
    },
    model: {
      set: function ( model ) {
        if ( this.__model !== null ) {
          this.unListen( this.__model );
        } else if ( this.__model === model ) return;
        else if ( !model ) {
          this.__model = null;
          return;
        }
        this.__model = model;
        this.setModel( model );
      },
      get: function () {
        return this.__model;
      }
    },
    setView : {
      value: function( viewList ) {
        this.listen(viewList, 'addView', function(event) { this.removeView.apply(this, event.arguments); });
        this.listen(viewList, 'removeView', function(event) { this.removeView.apply(this, event.arguments); });
        // removing previous views if any (candidate for optimization later, to reuse existing controllers in the list)
        if ( this.length ) {
          while ( this.length ) {
            var controller = this[i];
            controller.destroy();
            Array.prototype.pop.call(this);
          }
        }
        for ( var i =0; i < viewList.length; i++ ) {
          var view = viewList[i];
          this.addView(view);
        }
      }
    },
    setModel : {
      value: function( model ) {
        for ( var i = 0; i < this.length; i++ ) {
          this[i].setModel(model);
        }
      }
    },
    addView: {
      value: function( view ) {
        var newController = new this.ControllerConstructor(this.model, view);
        Array.prototype.push.call(this, newController);
      }
    },
    removeView: {
      value: function( view ) {
        for ( var i = 0; i < this.length; i++ ) {
          var controller = this[i];
          if ( controller.view == view ) {
            controller.destroy();
            Array.prototype.splice.call(this, i, 1);
            break;
          }
        }
      }
    }
  });


  // Controller list building method

  HtmlController.getControllerList = function(ControllerConstructor) {
    // Checking if it has been created before...
    if ( ControllerConstructor.ControllerList ) return ControllerConstructor.ControllerList;
    // Creating the constructor method
    var NewControllerList = function() {
      // Initializing the Html controller list
      HtmlControllerList.apply(this, arguments);
      // And letting it know which constructor is going to be using
      this.ControllerConstructor = ControllerConstructor;
    }
    // Inherinting from the Controller list
    NewControllerList.prototype = Object.create(HtmlControllerList.prototype);

    // Wrapping the original ControllerConstructor methods in the prototype, into ControllerList broadcasting methods, that will execute all controllers in the list;
    var properties = Object.getOwnPropertyNames(ControllerConstructor.prototype);
    for ( var i = 0; i < properties.length; i++ ) {
      var propertyName = properties[i];
      if ( ControllerConstructor.prototype[propertyName] instanceof Function ) {
        Object.defineProperty(NewControllerList.prototype, propertyName, {
          value: function () {
            var returnValues = []; // Is there a use case for this? shouldn't getting a return value, be the responsability of the model, and most controller methods are mutators and not accessors?
            for ( var i = 0; i < this.length; i++ ) {
              var returnValue = this[i][propertyName].apply(this[i], arguments);
              returnValues.push(returnValue);
            }
            return returnValues;
          }
        });
      }
    }
    ControllerConstructor.ControllerList = NewControllerList;
    return NewControllerList;
  }

  // Adding support for Controller initialization
  Function.prototype.new = function() {
    // If it is a controller...
    if ( this.prototype instanceof Controller  ) {
      var model = arguments[0];
      var view = arguments[1];
      if ( view instanceof HtmlView ) {
        var controller = Object.create(this.prototype);
        this.apply(controller, arguments);
        return controller;
      }
      else if ( view instanceof HtmlViewList ) {
        var ControllerList = HtmlController.getControllerList(this);
        var controller = Object.create(ControllerList.prototype);
        ControllerList.apply(controller, arguments);
        return controller;
      }
    } else if ( this.prototype instanceof Model  ) {



    }
  }

  return HtmlController;
});