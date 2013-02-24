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


  function wrapMethod( name ) {
    return function () {
      var returnValue = this.invoke(name, arguments); // triggers function
      return returnValue;
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


  function syncProperties() {
    // Finding if there are new enumerable properties added in the model wrapper, and move them to the model
    // If the model is an Array like object, then look for new numeric properties only
    if ( this.__model.length instanceof Number && this.__model.length > 0 && this.__model.hasOwnProperty(0) ) {
      var length = this.__model.length;
      var currentLength = this.__properties.length;
      // If lengths are the same, nothing to do
      if ( length === currentLength ) return;
      for ( var i = length; i < currentLength; i++ ) {
        this.__model[i] = this[i];
        var propertyWrapper = getPropertyWrapper(this.__model[i]);
        this.defineProperty(propertyName, propertyWrapper, true);
      }
      for ( var i = length; i > currentLength; i-- ) {
        this.deleteProperty(i);
      }
    }
    // Else look for other properties
    else {
      // Checking for new keys
      var keys = Object.keys(this);
      for ( var i = 0; i < keys.length; i++ ) {
        var propertyName = keys[i];
        if ( propertyName === 'event'  ) continue;
        if ( typeof this.__model[propertyName] === "undefined" ) {
          this.__model[propertyName] = this[propertyName];
          var propertyWrapper = getPropertyWrapper(this.__model[propertyName]);
          this.defineProperty(propertyName, propertyWrapper, true);
        }
      }
      // Looking for deleted keys
      var keys = Object.keys(this.__model);
      for ( var i in keys ) {
        var propertyName = keys[i];
        if ( typeof this.__properties[propertyName] === "undefined" ) {
          this.deleteProperty(propertyName);
        }
      }
    }
  }

  function getPropertyWrapper(property) {
    if ( property instanceof Object ) {
      // Getting evented Constructor wrapper
      var PropertyWrapperConstructor = Model.eventConstructor( property.constructor );
      var propertyWrapper = new PropertyWrapperConstructor(null);
      setModel.call(propertyWrapper, property);
      return propertyWrapper;
    } else {
      return property;
    }
  }

  function setModel( model ) {
    this.__model = model;
    // Finding if there are new enumerable properties added in the model wrapper, and move them to the model
    // If the model is an Array like object, then look for new numeric properties only
    if ( typeof this.__model.length == 'number' && this.__model.length > 0 && this.__model.hasOwnProperty(0) ) {
      this.defineProperty('length', this.__model.length, false);
      for ( var propertyName = 0; propertyName < this.__model.length; propertyName++ ) {
        var enumerable = this.__model.propertyIsEnumerable(propertyName);
        var propertyWrapper = getPropertyWrapper(this.__model[propertyName]);
        this.defineProperty(propertyName, propertyWrapper, enumerable);
      }
    }
    // Else look for other properties
    else {
      // Checking for new keys
      var keys = Object.keys(this.__model);
      for ( var i = 0; i < keys.length; i++ ) {
        var propertyName = keys[i];
        var enumerable = this.__model.propertyIsEnumerable(propertyName);
        var propertyWrapper = getPropertyWrapper(this.__model[propertyName]);
        this.defineProperty(propertyName, propertyWrapper, enumerable);
      }
    }
  }


/**
 *
 *  Model Class
 *
 * */

  function Model( data ) {
    EventEmitter.apply(this);
    // Define internal properties
    Object.defineProperties(this, {
      __model: {
        value: null,
        writable:true
      },
      __properties: {
        value: {}
      }
    });
    if ( arguments.length && data !== null ) {
      // If data is passed, then model is being instanced direclty, otherwise we can assume it being instanced for inheritance
      var Constructor =  Model.eventConstructor(data.constructor, this);
      var model = new Constructor(null);
      setModel.call(model, data);
      return model;
    }
    else  {
      return Object.create(this);
    }
  }

  Model.prototype = Object.create( EventEmitter.prototype );

  Model.propertyDescriptors = {
    constructor: {
      value: EventEmitter
    },
    defineProperty: {
      value: function ( name, property, enumerable ) {
        if ( !this.__properties.hasOwnProperty(name) ) {
          // Saving property
          this.__properties[name] = property;
          // If property is non numeric
          if ( !( Number(name) >= 0 )  ) {
            // creates set{Property} and get{Property} methods, if not already present in the model
            var capitalizedProperty = name.charAt( 0 ).toUpperCase() + name.slice( 1 );
            var setMethod =  'set'+capitalizedProperty;
            var getMethod =  'get'+capitalizedProperty;
            var prototype = Object.getPrototypeOf(this);
            // If a set Method is not defined, then create it (at the prototype level);
            if ( typeof this[setMethod] === 'undefined' ) {
              Object.defineProperty( prototype, setMethod, {
                value: getPropertySetter( name ),
                configurable: true
              });
            }
            // If a get Method is not defined, then create it (at the prototype level);
            if ( typeof this[getMethod] === 'undefined' ) {
              Object.defineProperty( prototype, getMethod, {
                value: getPropertyGetter( name ),
                configurable: true
              });
            }
          }
          // Creating setter / getters
          Object.defineProperty( this, name, {
            set: getPropertySetter( name ),
            get: getPropertyGetter( name ),
            enumerable: enumerable,
            configurable: true
          });
        }
      }
    },
    deleteProperty: {
      value: function ( name ) {
        delete this.__properties[name];
        delete this.__model[name];
        delete this[name];
        // CHECK: Should get{Name}/set{Name} be removed? Only useful for arrays or array like objects really...
      }
    },
    setProperty: {
      value: function ( propertyName, value ) {
        // If the value is the same, then there is no need to event
        if ( this.__model[propertyName] === value ) return;
        // We manually launch the event
        var capitalizedProperty = String(propertyName).charAt( 0 ).toUpperCase() + String(propertyName).slice( 1 );
        var setMethod =  'set'+capitalizedProperty;
        var event = this.createEvent( setMethod, { arguments: [value], defaultAction: function( value ) {
            // updating the internal mapper
            this.__properties[propertyName] = value;
            // updating the property on the wrapped object
            this.__model[propertyName] = value.__model ? value.__model : value;
        } });
        //event.arguments = [value];
        return this.dispatchEvent( event );
      }
    },
    getProperty: {
      value: function ( propertyName, internal ) {
        var capitalizedProperty = String(propertyName).charAt( 0 ).toUpperCase() + String(propertyName).slice( 1 );
        var getMethod =  'get'+capitalizedProperty;
        var event = this.createEvent( getMethod, { defaultAction: function() {
             if ( this.__properties[propertyName] ) return this.__properties[propertyName];
             else return this.__model[propertyName];
        } });
        return this.dispatchEvent( event );
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
        var properties = Object.getOwnPropertyNames(data);
        for ( var i = 0; i < properties.length; i++ ) {
          var propertyName = properties[i]
          var propertyDescriptor = Object.getOwnPropertyDescriptor( data, propertyName );
          this.defineProperty( propertyName, propertyDescriptor );
        }
      }
    },
    invoke: {
      value: function( methodName, args ) {
        // Invoking the method, from the wrapped model, in the context of "this"
        var returnValue = this.__model[methodName].apply(this, args);
        // Sync newly created or deleted properties
        syncProperties.call(this);
        // If the return value is and object, but not an instance of model, wrap it...
        if ( returnValue instanceof Object && !( returnValue instanceof Model ) ) {
          return getPropertyWrapper( returnValue );
        } else {
          return returnValue;
        }
      }
    }
  };

  Object.defineProperties( Model.prototype, Model.propertyDescriptors );




  Model.eventConstructor = function ( Constructor, newModel ) {
    if ( Constructor !== Object && Constructor.eventedConstructor ) return Constructor.eventedConstructor;
    // Creating a sample model with the purpose of creating the required sub model properties, and prototype methods to be wrapped.
    //var sampleModel = new Constructor();

    // Creating the sample constructor, to be used to build new pre-wrapped models following the same strurcture and functionality as the wrapper.
    var EventedConstructor = function () {
      // Initializing model
      //Model.call( this );
      // Initializing model properties
      Object.defineProperties(this, {
        __model: {
          // If 'model' argument is just plain data, then initialize new model, and pass the data, otherwise, it is a model, create a new Object
          value: null,
          writable:true
        },
        __properties: {
          value: {}
        }
      });

      if ( arguments[0] !== null ) {        
        if ( Constructor === Array ) {
          setModel.call(this, Array.apply(null, arguments));
        }
        else {
          // Creating new object, inheriting from Constructor prototype, but without constructing
          var model = Object.create( Constructor.prototype );
          // Applying constructor method, to the new model, using the same arguments as provided to the evented constructor
          Constructor.apply(model, arguments);
          setModel.call(this, model);
        }
      }
    }

    // Inheriting the new prototype from the Model Object
    if ( Constructor !== Object  ) {
      var PrototypeConstructor = Model.eventConstructor(Object.getPrototypeOf(Constructor.prototype).constructor, newModel);
      EventedConstructor.prototype = new PrototypeConstructor(null);
      Object.defineProperty( EventedConstructor.prototype, 'constructor', {
        value: Constructor,
      });
    }
    else {
      EventedConstructor.prototype = newModel || new Model(null);
      Object.defineProperty( EventedConstructor.prototype, 'constructor', {
        value: Constructor,
      });
    }

    //var prototype = EventedConstructor.prototype;


    // Adding property setters and getters for this model wrapper
    //  for ( var propertyName in sampleModel ) {
    //      var capitalizedProperty = propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
    //      var setMethod =  'set'+capitalizedProperty;
    //      var getMethod =  'get'+capitalizedProperty;
    //      // If a set Method is not defined, then create it (at the prototype level);
    //      Object.defineProperty( prototype, setMethod, {
    //        value: getPropertySetter( propertyName ),
    //        configurable: true
    //      });
    //      // If a get Method is not defined, then create it (at the prototype level);
    //      Object.defineProperty( prototype, getMethod, {
    //        value: getPropertyGetter( propertyName ),
    //        configurable: true
    //      });
    //      // Creating setter / getters
    //      Object.defineProperty( prototype, propertyName, {
    //        set: getPropertySetter( propertyName ),
    //        get: getPropertyGetter( propertyName ),
    //        enumerable: true
    //      });
    //  }

    // Defining prototype methods to map to the invoke event
    var propertyNames = Object.getOwnPropertyNames( Constructor.prototype );
    for ( var i = 0; i < propertyNames.length; i++ ) {
      var propertyName = propertyNames[i];
      // If the property name is a constructor
      if ( propertyName === 'constructor' ) continue;
      // Check if the property is a method, otherwise, simply define a property getter/setter
      if ( Constructor.prototype[propertyName] instanceof Function ) {
        Object.defineProperty( EventedConstructor.prototype, propertyName, {
          value: wrapMethod( propertyName ),
          configurable:true
        })
      }
    }


    if ( Constructor !== Object ) Constructor.eventedConstructor = EventedConstructor;

    return EventedConstructor;

  }




  return Model;
});