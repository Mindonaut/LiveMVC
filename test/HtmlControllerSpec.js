define(function ( require ) {
  var HtmlElementController = require('HtmlElementController');
  var HtmlController = require('HtmlController');
  var Model = require('Model');



  describe('HTML View Controller Test', function () {


    describe('On demand creation of a controller based on the model provided', function () {

      it('should create a controller that reflects the model', function () {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property2:></b><property1:>";
        var model = new Model({property1: {}, property2: "world" });
        var controller = new HtmlController( model, view );
        expect( controller.property1 ).to.be.instanceOf( HtmlController);
        expect( view.querySelector('property2\\:').innerText ).to.equal("world");
      });

//      it('should not create subControllers when matching tags for their views are not present', function (  ) {
//        var view = document.createElement('div');
//        view.innerHTML = "<b>hello </b>";
//        var model = new Model({property1: {}});
//        var controller = new HtmlController( model, view );
//        expect( controller.property1 ).to.be.undefined;
//        expect( view.querySelector('property1\\:') ).to.equal( null );
//      });

      it('Model primitive values should fill both special tags and elements with a name attribute', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <input name='property2'></b><div name='property1' contenteditable='true'>";
        var model = new Model({property1: "forever", property2: "world" });
        var controller = new HtmlController( model, view );
        expect( view.querySelector('*[name="property1"]').innerText ).to.equal("forever");
        expect( view.querySelector('*[name="property2"]').value ).to.equal("world");
      });

      it('should automatically bind to input element changes, when those elements are not within a form', function (  ) {
        var view = document.createElement('div');
        document.body.appendChild(view);
        view.innerHTML = "<b>hello <input name='property2'></b><div name='property1' contenteditable='true'>";
        var model = new Model({property1: "forever", property2: "world" });
        var controller = new HtmlController( model, view );
        var change = new CustomEvent('change', {bubbles:true});
        var input = new CustomEvent('input', {bubbles:true});

        var element1 = view.querySelector('*[name="property1"]')
        element1.innerText = "now";
        element1.dispatchEvent(input);
        var element2 = view.querySelector('*[name="property2"]')
        element2.value  = "you";
        element2.dispatchEvent(change);

        expect(model.property1).to.equal("now");
        expect(model.property2).to.equal("you");
        document.body.removeChild(view);
      });

      it('when setting a property of the controller that represents a sub controller, it should unsubscribe from the old controller and re subscribe to the new controller', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b>";
        var model = new Model( { property1: new Model( { subProperty: true } ) } );
        var controller = new HtmlController( model, view );

        expect( controller.property1 ).to.be.instanceOf( HtmlController );
        expect( controller.property1.model ).to.equal( model.property1 );

        var subController = new HtmlController();
        controller.property1 = subController;
        expect( subController.model ).to.equal( model.property1 );
        expect( subController ).to.equal( controller.property1 );
      });

      it('should update the content of the view, if the model updates', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        expect( view.querySelector('property1\\:').innerText ).to.equal("world");
        model.property1 = "everyone!"
        expect( view.querySelector('property1\\:').innerText ).to.equal("everyone!");
      });

      it('should allow to set a new model and bind to it', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        expect( view.querySelector('property1\\:').innerText ).to.equal("world");
        var newModel = new Model( { property1: "everyone!" } );
        controller.setModel( newModel );
        expect( view.querySelector('property1\\:').innerText ).to.equal("everyone!");
      });

      it('should allow to set a new view and bind to it', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        expect( view.querySelector('property1\\:').innerText ).to.equal("world");
        var newView = document.createElement('span');
        newView.innerHTML = "<b>hello <input name='property1'></b>";
        controller.setView( newView );
        expect( newView.querySelector('*[name="property1"]').value ).to.equal("world");

      });

//      xit('should be possible to load an external view, and detect when the view has been updated/loaded', function (  ) {
//
//      });

//      xit('When the view is empty, it should be able to automatically load a view with the same name as the controller', function (  ) {
//
//      });

      it('the controller should call a set{Property} method, whenever a model property gets updated', function ( done ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        controller.setProperty1 = function( property1 ) {
          expect( property1 ).to.equal( "mundo" );
          done()
        }
        model.property1 = "mundo";

      });

      it('should be possible to extend a controller, and manually define subcontrollers at construction', function (  ) {
        function SuperController( model, view ) {
          this.subController = new HtmlElementController( model.who, view.querySelectorAll('who\\:') );
          this.greeting = new HtmlElementController();
          this.initializeController( model, view );

        }
        SuperController.prototype = new HtmlController();
        SuperController.prototype.constructor = SuperController;
        SuperController.prototype.method = function() {
          this.view.className = "changed";
        }
        SuperController.prototype.setWho = function( who ) {
          this.subController.setModel( who );
        }

        var superModel = function() {
          this.who = "world";
          this.greeting = "hola"
          return new Model(this);
        }
        superModel.prototype.method = function() {
          this.who = "everyone!";
          this.greeting = "saludos";
        }

        var view = document.createElement('div');
        view.innerHTML = "<b><greeting:>hello</greeting:> <who:></b>";

        var model = new superModel();
        expect( model.who ).to.equal("world");

        var controller = new SuperController( model, view );
        expect( view.querySelector('who\\:').innerText ).to.equal("world");
        expect( view.querySelector('greeting\\:').innerText ).to.equal("hola");

        model.method();
        expect( model.who ).to.equal("everyone!");
        expect( model.greeting ).to.equal("saludos");

        expect( view.querySelector('who\\:').innerText ).to.equal("everyone!");
        expect( view.querySelector('greeting\\:').innerText ).to.equal("saludos");
        expect( view.className ).to.equal("changed");
      });

      it('Destroying a controller, should also destroy the children controllers ', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <input name='property2'></b><div name='property1' contenteditable='true'>";
        var model = new Model({property1: "forever", property2: "world" });
        var controller = new HtmlController( model, view );
        expect( controller.property1.view[0].innerText ).to.equal("forever");
        expect( controller.property2.view[0].value ).to.equal("world");
        expect( controller.property1.model ).to.equal("forever");
        expect( controller.property2.model ).to.equal("world");
        controller.destroy();
        expect( controller.property1.view ).to.be.null;
        expect( controller.property2.view ).to.be.null;
        expect( controller.property1.model ).to.be.null;
        expect( controller.property2.model ).to.be.null;

      });

      it('When updating a controller view, the subcontroller view should be set if it does not have a view', function (  ) {
        function SuperController( model, view ) {
          this.subController = new HtmlElementController( model.who, view.querySelectorAll('who\\:') );
          this.initializeController( model, view );
        }
        SuperController.prototype = new HtmlController();
        SuperController.prototype.constructor = SuperController;
        var view = document.createElement('div');
        view.innerHTML = "<b><greeting:>hello</greeting:> <who:></b>";
        var model = new Model( { who: "world" } );
        var controller = new SuperController( model, view );
        controller.view = view;
        expect( controller.subController.view ).to.deep.equal( view.querySelectorAll('who\\:') );

      });

      it('When updating a controller view, the subcontroller view should be set if it does not belong to the new view', function (  ) {
        function SuperController( model, view ) {
          this.subController = new HtmlElementController( model.who, view.querySelectorAll('who\\:') );
          this.initializeController( model, view );
        }
        SuperController.prototype = new HtmlController();
        SuperController.prototype.constructor = SuperController;
        var view = document.createElement('div');
        view.innerHTML = "<b><greeting:>hello</greeting:> <who:></b>";
        var model = new Model( { who: "world" } );
        var controller = new SuperController( model, view );
        expect( controller.subController.view ).to.deep.equal( view.querySelectorAll('who\\:') );
        var view2 = document.createElement('span');
        view2.innerHTML = "<b><greeting:>hello</greeting:> <input name='subController'></b>";
        controller.view = view2;
        expect( controller.subController.view ).to.deep.equal( view2.querySelectorAll('*[name="subController"]') );
      });

      it('should capture clicks on anchors, cancel their default action if they are relative links and use them to run controller actions', function ( done ) {
        var view = document.createElement('div');
        document.body.appendChild(view);
        view.innerHTML = "<b>hello <property1:></b><a href='action'>action</a>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        controller.action = function ( actionModel, actionView, actionController) {
          expect( actionModel ).to.equal( model );
          expect( actionView ).to.equal( view );
          expect( actionController ).to.equal( this );
          done();
        }
        view.querySelector('a').click();
        document.body.removeChild(view);
      });


      xit('should be possible to remove a property', function (  ) {
        
      });

      xit('should be possible to update all properties for a new model, if the model was non Class build (directly from Model)', function (  ) {
        
      });

      xit('action events, should be able to bubble up to the parent controller, until the action can be handled', function (  ) {
        var view = document.createElement('div');
        view.innerHTML = "<b>hello <property1:></b><a href='action'>action</a>";
        var model = new Model( { property1: "world" } );
        var controller = new HtmlController( model, view );
        controller.action = function ( actionModel, actionView, actionController) {
          expect( actionModel ).to.equal( model );
          expect( actionModel ).to.equal( model );
        }
      });

      xit('the address bar gets updated whenever an action is triggered, and if bookmarked the page will be able to replicate the last state of the page at the bookmarked location', function (  ) {
        
      });
      
      xit('Should return', function (  ) {
        
      });
      
      

    });
  });
});