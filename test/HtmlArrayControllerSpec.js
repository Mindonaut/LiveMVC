define(function ( require ) {
  var Controller = require('Controller');
  var HtmlArrayController = require('HtmlArrayController');
  var HtmlController = require('HtmlController');
  var Model = require('Model');

  describe('HTML View Array Controller ', function () {


    describe('Testing an array model', function () {

      it('should create a controller that reflects the array model', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3,4]);

        var controller = new HtmlArrayController( model, view );
        expect( view.childNodes[0].innerText ).to.equal("1");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("3");
        expect( view.childNodes[3].innerText ).to.equal("4");
      });

       it('should respond to the push event', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([]);

        var controller = new HtmlArrayController( model, view );

        model.push(1);
        expect( view.childNodes[0].innerText ).to.equal("1");
        model.push(2);
        expect( view.childNodes[1].innerText ).to.equal("2");
        model.push(3);
        expect( view.childNodes[2].innerText ).to.equal("3");
        model.push(4);
        expect( view.childNodes[3].innerText ).to.equal("4");
        model.pop();
        expect( view.childNodes[3] ).to.be.undefined;

      });

       it('should responde to the pop event', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3,4]);
        var controller = new HtmlArrayController( model, view );
        model.pop();
        expect( view.childNodes[3] ).to.be.undefined;
      });

      it('there should be as many view sub elements as model elements', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3,4,5,6,7,8,9,0]);

        var controller = new HtmlArrayController( model, view );

        expect( view.childNodes.length ).to.equal(10);

      });

      it('should be able to respond to the splice method', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3,4,5,6,7,8,9,10]);

        var controller = new HtmlArrayController( model, view );

        expect( view.childNodes.length ).to.equal(10);
        expect( view.childNodes[0].innerText ).to.equal("1");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("3");
        expect( view.childNodes[3].innerText ).to.equal("4");
        expect( view.childNodes[4].innerText ).to.equal("5");
        expect( view.childNodes[5].innerText ).to.equal("6");
        expect( view.childNodes[6].innerText ).to.equal("7");
        expect( view.childNodes[7].innerText ).to.equal("8");
        expect( view.childNodes[8].innerText ).to.equal("9");
        expect( view.childNodes[9].innerText ).to.equal("10");
        model.splice(0,5);
        expect( view.childNodes[0].innerText ).to.equal("6");
        expect( view.childNodes[1].innerText ).to.equal("7");
        expect( view.childNodes[2].innerText ).to.equal("8");
        expect( view.childNodes[3].innerText ).to.equal("9");
        expect( view.childNodes[4].innerText ).to.equal("10");
      });

      it('should be able to respond to the shift method', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3]);

        var controller = new HtmlArrayController( model, view );

        expect( view.childNodes[0].innerText ).to.equal("1");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("3");

        model.shift();

        expect( view.childNodes[0].innerText ).to.equal("2");
        expect( view.childNodes[1].innerText ).to.equal("3");

      });

      it('should be able to respond to the unshift method', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3]);

        var controller = new HtmlArrayController( model, view );

        expect( view.childNodes[0].innerText ).to.equal("1");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("3");

        model.unshift(10);

        expect( view.childNodes[0].innerText ).to.equal("10");
        expect( view.childNodes[1].innerText ).to.equal("1");
        expect( view.childNodes[2].innerText ).to.equal("2");
        expect( view.childNodes[3].innerText ).to.equal("3");
      });

      it('should be able to respond to the reverse method', function () {
        var view = document.createElement('div');
        view.innerHTML = "<li></li>";
        var model = new Model([1,2,3]);

        var controller = new HtmlArrayController( model, view );

        expect( view.childNodes[0].innerText ).to.equal("1");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("3");

        model.reverse();

        expect( view.childNodes[0].innerText ).to.equal("3");
        expect( view.childNodes[1].innerText ).to.equal("2");
        expect( view.childNodes[2].innerText ).to.equal("1");
      });

    });
  });
});
