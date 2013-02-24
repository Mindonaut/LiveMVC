define(function ( require ) {
  var Controller = require('../Controller');
  var Model = require('../Model');

  describe('Controller Test', function () {


    describe('When testing the controller listening functions', function () {
      var controller, model;
      before(function () {
        controller = new Controller();
        model = new Model();
      });
      after(function () {

      });

      it('should allow to listen to an event Emitter', function () {
        controller.listen(model, "event", function () {});
      });

      it('should not call an eventListener we are listening, if we unlisten it', function ( done ) {
        var listener = function () {
          done();
        }
        controller.listen(model, "event", listener);
        controller.unListen(model, "event", listener);
        model.dispatchEvent('event');
      });

      it('should not call en eventListener, if we unlisten all', function ( done ) {
        var called = false;
        controller.listen(model, "event", function () {
          called = true;
        });
        controller.unListenAll();
        model.dispatchEvent('event');
        setTimeout(function () {
            expect(called).to.be.false;
            done();
        })
      });
    });
  });
});