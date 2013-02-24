define(function( require ) {

  function Model = require ("Model");

  function ObjectModel( data ) {
    if ( data ) {
      this.set(data);
    }
  }

  ObjectModel.propertyDescriptors = {
    defineProperty: {
      value: function ( name, value ) {
        if ( value instanceof Object ) {
          // creates set{Property} and get{Property} methods, if not already present in the model
          var capitalizedProperty = name.charAt( 0 ).toUpperCase() + name.slice( 1 );
          var setMethod =  'set'+capitalizedProperty;
          var getMethod =  'get'+capitalizedProperty;
          var proto = Object.getPrototypeOf(this);
          if ( typeof this[setMethod] === "undefined" ) { // If a set Method is not defined, then create it (at the prototype level);
            Object.defineProperty( proto, setMethod, {
              value: function(value) {
                // Rememeber to add automatic type checking
                this.value = value;
              },
              configurable: false,
              writable: false,
              enumerable: false
            });
          }

          if ( typeof this[getMethod] === "undefined" ) {
            this[getMethod] = function () {
              return this[name];
            };
          }

        } else if ( value instanceof Function ) {


        } else {


        }
      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    deleteProperty: {
      value: function () {

      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    setProperty: {
      value: function (propertyName, value) {
        var setMethod =  'set'+propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
        if ( this[setMethod] ) {
          if ( this[propertyName] === value ) return;
          this[setMethod](value);
        } else {
          return;
        };
      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    getProperty: {
      value: function (propertyName) {
        var getMethod =  'get'+propertyName.charAt( 0 ).toUpperCase() + propertyName.slice( 1 );
        if ( this[getMethod] ) {
          return this[getMethod](value);
        } else {
          return this[propertyName];
        };
      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    defineProperties: {
      value: function () {

      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    deleteProperties: {
      value: function () {

      },
      configurable: false,
      writable: false,
      enumerable: false
    },
    invoke: {
      value: function ( methodName, arguments ) {
        return this[methodName].apply( this, arguments );
      },
      configurable: false,
      writable: false,
      enumerable: false
    }
  };
  ObjectModel.Meta = Function(){}
  ObjectModel.prototype = new Model()

  Object.defineProperties(ObjectModel.prototype, ObjectModel.propertyDescriptors );

  return ObjectModel;
});