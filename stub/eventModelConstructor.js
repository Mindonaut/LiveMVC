define(function ( require ) {
  //var ArrayModel = require('ArrayModel');
  var ObjectModel = require('ObjectModel');
  var Model = require('Model');


  function wrapMethod( name ) {
      return function () {
        return this.invoke( name, Array.apply( null, arguments ) );
      };
  }
  function getPropertySetter( name ) {
      return function (value) {
        // If the current value of the property and the new value are the same, return;
        if ( this.__model[name] === value ) return;
        // Manually dispatching event with no default action, to avoid infinite loops
        var event = this.createEvent('setProperty');
        event.arguments = [name, value];
        this.dispatchEvent(event);
        this.__model[name] = value;
      };
  }

  function getPropertyGetter( name ) {
    return function () {
      // Manually dispatching event with no default action, to avoid infinite loops
      var event = this.createEvent('getProperty');
      event.arguments = [name];
      //this.dispatchEvent(event);
      return this.__model[name];
    }
  }


  function getBottomProto(prototype) {
      if ( prototype.constructor == Object ) return prototype;
      //else return getBottomProto(Object.getPrototypeOf(prototype));
      else return getBottomProto(prototype.constructor.prototype);
  }

  function getAllMethodNames( prototype ) {
    var methodNames = Object.getOwnPropertyNames( prototype );
    var childPrototype = Object.getPrototypeOf( prototype );
    if ( childPrototype.constructor !== Object ) {
      methodNames.concat( getAllMethodNames( childPrototype ) );
    }
    return methodNames;
  }



  function eventModelConstructor( Constructor ) {
    if ( Constructor.EventedConstructor ) return Constructor.EventedConstructor;


    var proto = getBottomProto(Constructor.prototype);
    // If the Constructor does not inherit from  ObjectModel
    if ( !(proto instanceof ObjectModel) ) {
      // Adding Object Model prototype methods
      Object.defineProperties(Constructor.prototype, ObjectModel.propertyDescriptors);
    }

    // Wrapping Constructor prototype methods
    var methodNames = getAllMethodNames(Constructor.prototype);
    // Create property descriptors for invoke-wrapped versions of all methods in the prototype (Which includes those of the PrototypeModel, and Constructor)
    var wrapperPropertyDescriptors = {};
    for ( var i in methodNames ) {
      var name = methodNames[i];
      wrapperPropertyDescriptors[name] = {
        value: wrapMethod( name, Constructor.prototype[name] ),
        configurable: false,
        writable: false,
        enumerable:false
      };
    }

    // Creating new constructor, which will include the wrapped methods of both the PrototypeModel, and the Constructor
    // It will also create the setter/getters that will event to setProperty
    function EventedConstructor() {
      // Creating model
      var model = Object.create(Constructor.prototype);
      // Creating the actual properties... and assuming they are
      Constructor.apply(model, arguments);

      // creating internal reference to this model
      Object.defineProperties(this,
      {
        '__model': {
          value: model,
          configurable: false,
          enumerable:false,
          writable: false
        },
        '__listeners': {
          value: {},
          configurable: false,
          enumerable:false,
          writable: false
        }
      });


      var properties = Object.getOwnPropertyNames(model);

      for ( var i = 0; i < properties.length; i++ ) {
        var propertyName = properties[i];
        Object.defineProperty(this, propertyName, {
          set: getPropertySetter( propertyName ),
          get: getPropertyGetter( propertyName ),
          configurable: true,
          enumerable:true,
        });
      }
    }

    EventedConstructor.prototype = Object.create(Model.prototype, wrapperPropertyDescriptors);
    // Caching the evented constructor
    Constructor.EventedConstructor = EventedConstructor
    return EventedConstructor;
  }


  return eventModelConstructor;

});