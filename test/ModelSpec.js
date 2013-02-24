define(function ( require ){
  var Model = require('../Model');

  describe('Model Test', function () {


    describe('When adding an event listener to a new Model', function () {
      var model;
      before(function () {
        //model = new Model();
      });
      after(function () {

      });



      it('should reflect the data passed to it', function () {
        var model = new Model({ a: 1, b: 2 });
        expect( model.a ).to.equal( 1 );
        expect( model.b ).to.equal( 2 );
      });

      it('setting a property should trigger a setProperty event', function ( done ) {
        var model = new Model({ a: 1, b: 2 });
        model.addEventListener('setProperty', function ( event ) {
          expect( model.a ).to.equal( 2 );
          done();
        });
        model.a = 2;
      });

      it('getting a property should trigger a getProperty event', function ( done ) {
        var model = new Model({ a: 1, b: 2 });
        model.addEventListener('getProperty', function ( event ) {
          done();
        });
        var a = model.a;
      });

      it('defining a property automatically creates a setter for that property that we can subscribe to', function ( done ) {
        var model = new Model({ a: 1, b: 2 });
        expect( model.setA ).to.be.instanceOf( Function );
        expect( model.setB ).to.be.instanceOf( Function );
        model.addEventListener('setA', function ( event ) {
          expect( model.a ).to.equal( 2 );
          done();
        });

        model.a = 2;
      });

      it('defining a property automatically creates a getter for that property that we can subscribe to', function (  ) {
        var model = new Model({ a: 1, b: 2 });
        expect( model.getA ).to.be.instanceOf( Function );
        expect( model.getB ).to.be.instanceOf( Function );

      });

      it('defining a property automatically creates a getter for that property that we can subscribe to', function (  ) {
        var model = new Model({ a: 1, b: 2 });
        expect( model.getA ).to.be.instanceOf( Function );
        expect( model.getB ).to.be.instanceOf( Function );

      });

      it('should be possible to have models with other objects as properties, that also get wrapped', function (  ) {
        var model = new Model({ a: 1, b: 2 });
        expect( model.getA ).to.be.instanceOf( Function );
        expect( model.getB ).to.be.instanceOf( Function );

      });


      it('should be possible wrap an array', function (  ) {
        var WrappedArray = Model.eventConstructor(Array);
        var model = new WrappedArray(1,2,3,4,5)
        //var model = new Model([1,2,3,4,5]);
        expect( model[0] ).to.equal( 1 );
        expect( model[1] ).to.equal( 2 );
        expect( model[2] ).to.equal( 3 );
        expect( model[3] ).to.equal( 4 );
        expect( model[4] ).to.equal( 5 );
        model.addEventListener('push', function() {
          expect( model[5] ).to.equal( 1 );
        });
        model.push(1);
        expect( model[5] ).to.equal( 1 );
        var length = model.push(0,0,0,0);
        expect( length ).to.equal( 10 );
        expect( model[6] ).to.equal( 0 );
        expect( model[7] ).to.equal( 0 );
        expect( model[8] ).to.equal( 0 );
        expect( model[9] ).to.equal( 0 );
        var resultModel = model.splice(1,9);
        expect( model.length ).to.equal( 1 );
        expect( resultModel.length ).to.equal( 9 );
        resultModel.addEventListener('pop', function() {
          expect( resultModel.length ).to.equal( 8 );
        });
        var value = resultModel.pop();
        expect( value ).to.equal( 0 );
      });

      it('should be possible to create and evented Model Constructor, from a non evented one', function ( done ) {
        function CustomModel() {
          this.name = "";
          this.property = "value";
          this.otherProperty = 5;
        }

        CustomModel.prototype.makeNewName = function() {
          this.name = "New name";
        }

        var EventedCustomModel = Model.eventConstructor( CustomModel );

        var model = new EventedCustomModel();

        model.addEventListener('makeNewName', function ( event ) {
          expect( model.name ).to.equal( "New name" );
          done();
        });

        model.makeNewName();
      });

    });
  });
});