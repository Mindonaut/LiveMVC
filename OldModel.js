define(function( require ) {

  var EventEmitter = require('EventEmitter');

/**
 * Helper methods
 *
 * */


  function getAllPropertyNames( prototype ) {
    if ( prototype !== Model.prototype && prototype !== Object.prototype ) {
      // Assuming property names will not repeat
      var names = Object.getOwnPropertyNames( prototype );
      return names.concat( getAllPropertyNames( Object.getPrototypeOf( prototype ) ) );
    } else return [];
  }


  function wrapMethod( name, method ) {
    //console.log("Wraping method %s", name);
    var invoked = false;
    return function () {
      if ( invoked  ) {
        //console.log('Calling %s directly', name)
        method.apply(this, arguments);
        invoked = false;
      } else {
        //console.log('Calling %s via invoke function, to trigger event', name)
        invoked = true;
        this.invoke(name, arguments); // triggers function
      }
    }
  }

  function getPropertySetter( name ) {
    return function( value ) {
      this.setProperty( name, value );
    }
  }

  function getPropertyGetter( name ) {
    return function() {
      return this.getProperty( name );
    }
  }


/**
 *
 *  Model Class
 *
 * */

  function Model( data ) {
      EventEmitter.apply(this);
      // If data is passed, then model is being instanced direclty, otherwise we can assume it being instanced for inheritance
      if ( data ) {
        var model = Object.create(this);
        model.initializeModel( data );
        return model;
      }
  }

  Model.prototype = Object.create( EventEmitter.prototype );


  Model.propertyDescriptors = {
    constructor: {
      value: EventEmitter
    },
    initializeModel: {
      value: function ( data ) {
        // Finding out if there are properties created at construction, before initializing our own
        var properties = Object.getOwnPropertyNames( this );

        // Define internal properties
        Object.defineProperties(this, {
          __model: {
            value: {}
          }
        });

        // Create getter/setters

        if ( properties.length ) {
          for ( var i = 0; i < properties.length; i++ ) {
            var name = properties[i];
            var value = this[name];
            this.defineProperty( name, value );
          }
          // If data has been provided, then
          if ( data ) this.updateProperties( data );
        // if no properties were created at construction, then it means they will come from data
        } else if ( data ) {
          var properties = Object.getOwnPropertyNames( data );
          for ( var i = 0; i < properties.length; i++ ) {
            var name = properties[i];
            var value = data[name];
            this.defineProperty( name, value );
          }
          // Importing data's prototype into this object
          var prototype = Object.getPrototypeOf( this );
          var names = getAllPropertyNames( data.constructor.prototype );
          for ( var i = 0; i < names.length; i++ ) {
            var name = names[i];
            if ( name === 'constructor' || !( data.constructor.prototype[name] instanceof Function ) ) continue;
            Object.defineProperty(prototype, name, {
              value: wrapMethod.call( this, name, data.constructor.prototype[name] ),
              configurable: true,
            });
          }
        }

        var prototype = Object.getPrototypeOf( this );
        // If prototype has not been wrapped before,
        // Wrap prototype methods on invoke calls (plus property handling methods)
        if ( !prototype.hasOwnProperty('defineProperty') ) {

          var names = getAllPropertyNames( prototype );
          for ( var i = 0; i < names.length; i++ ) {
            var name = names[i];
            if ( name === 'constructor' || name.indexOf('__') === 0 ) continue;
            Object.defineProperty(prototype, name, {
              value: wrapMethod.call( this, name, this[name] ),
              configurable: true,
            });
          }
        }
      }
    },
    defineProperty: {
      value: function ( name, value ) {
        // creates set{Property} and get{Property} methods, if not already present in the model
        var capitalizedProperty = name.charAt( 0 ).toUpperCase() + name.slice( 1 );
        var setMethod =  'set'+capitalizedProperty;
        var getMethod =  'get'+capitalizedProperty;
        var prototype = Object.getPrototypeOf(this);
        // If a set Method is not defined, then create it (at the prototype level);
        if ( typeof this[setMethod] === 'undefined' ) {
          Object.defineProperty( prototype, setMethod, {
            value: getPropertySetter.call( this, name ),
            configurable: true
          });
        }
        // If a get Method is not defined, then create it (at the prototype level);
        if ( typeof this[getMethod] === 'undefined' ) {
          Object.defineProperty( prototype, getMethod, {
            value: getPropertyGetter.call( this, name ),
            configurable: true
          });
        }
        // Creating setter / getters
        Object.defineProperty( this, name, {
          set: getPropertySetter.call( this, name ),
          get: getPropertyGetter.call( this, name ),
          enumerable: true
        });

        // Setting model to default value
        this.__model[name] = value;
      }
    },
    deleteProperty: {
      value: function ( name ) {
        delete this.__model[name];
        delete this[name];
        // CHECK: Should get{Name}/set{Name} be removed?
      }
    },
    setProperty: {
      value: function ( propertyName, value ) {
        // If the value is the same, then there is no need to event
        if ( this.__model[propertyName] === value ) return;
        // We manually launch the event
        var capitalizedProperty = propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
        var setMethod =  'set'+capitalizedProperty;
        var event = this.createEvent( setMethod, { defaultAction: function( value ) {
            this.__model[propertyName] = value
        } });
        event.arguments = [value];
        this.dispatchEvent( event );
      }
    },
    getProperty: {
      value: function ( propertyName ) {
        //var capitalizedProperty = propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
        //var getMethod =  'get'+capitalizedProperty;
        //var event = this.createEvent( getMethod, { defaultAction: function(  ) {
             return this.__model[propertyName];
        //} });
        //return this.dispatchEvent( event );
      }
    },
    defineProperties: {
      value: function ( data ) {
        for ( var name in data ) {
          this.defineProperty( name, data[name]);
        }
      }
    },
    deleteProperties: {
      value: function () {
        for ( var name in this.__model ) {
          this.deleteProperty( name );
        }
      }
    },
    updateProperty: {
      value: function ( name, value ) {
        if ( !this.__model.hasOwnProperty( name ) ) return;
        if ( this.__model[name].updateProperties ) {
          this.__model[name].updateProperties( name );
        } else {
          this.__model[name] = value;
        }
      }
    },
    updateProperties: {
      value: function ( data ) {
        for ( var name in data ) {
          this.updateProperty( name, data[name] );
        }
      }
    },
    setProperties: {
      value: function ( data ) {
        this.deleteProperties();
        for ( var name in data ) {
          this.defineProperty( name, data[name] );
        }
      }
    },
    invoke: {
      value: function( methodName, arguments ) {
        this[methodName].apply(this, arguments);
      }
    }
  };

  Object.defineProperties( Model.prototype, Model.propertyDescriptors );


  Model.eventConstructor = function ( Constructor ) {

    if ( Constructor.eventedConstructor ) return Constructor.eventedConstructor;

    var sampleModel = new Constructor();

    var EventedConstructor = function () {
      EventEmitter.call( this );
      Object.defineProperties(this, {
        __model: {
          value: {}
        }
      });
      Constructor.apply( this, arguments );
    }
    // Defining default model events
    EventedConstructor.prototype = Object.create( EventEmitter.prototype, Model.propertyDescriptors );

    var prototype = EventedConstructor.prototype;
    // Adding property setters and getters for this model wrapper
    for ( var propertyName in sampleModel ) {
      var capitalizedProperty = propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
      var setMethod =  'set'+capitalizedProperty;
      var getMethod =  'get'+capitalizedProperty;
      // If a set Method is not defined, then create it (at the prototype level);
      Object.defineProperty( prototype, setMethod, {
        value: getPropertySetter( propertyName ),
        configurable: true
      });
      // If a get Method is not defined, then create it (at the prototype level);
      Object.defineProperty( prototype, getMethod, {
        value: getPropertyGetter( propertyName ),
        configurable: true
      });
      // Creating setter / getters
      Object.defineProperty( prototype, propertyName, {
        set: getPropertySetter( propertyName ),
        get: getPropertyGetter( propertyName ),
        enumerable: true
      });

      // Defining prototype methods to mapp to the invoke event

      var propertyNames = Object.getOwnPropertyNames( sampleModel.constructor.prototype );

      for ( var i = 0; i < propertyNames.length; i++ ) {
        var propertyName = propertyNames[i];
        // Check if the property is a method, otherwise, simply define a property getter/setter
        if ( sampleModel[propertyName] instanceof Function ) {
          prototype[propertyName] = function() {
            this.invoke(propertyName, arguments);
          }

        }



      }

    }

    //Object.defineProperties(EventedConstructor.prototype, )

    Constructor.eventedConstructor = EventedConstructor;

    return EventedConstructor;

  }


  var model.eventModel = function ( value ) {
    var Constructor = this.eventConstructor( value.constructor );
    var eventedModel = new Constructor( value );
    return eventedModel;
  }











  return Model;
});