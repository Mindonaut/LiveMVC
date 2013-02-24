define(function( require ) {
  var EventEmitter = require("EventEmitter");

  describe('EventEmitter Test', function () {

    it('should allow to add an event listener, and return it', function () {
      var eventEmitter = new EventEmitter();
      var listener = eventEmitter.addEventListener('event', function( event ) {});
      expect(listener).to.be.instanceof( Function );
    });

    it('should trigger the event when called', function ( done ) {
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        done();
      });
      var event = eventEmitter.createEvent('event')
      eventEmitter.dispatchEvent( event );
    });

    it('should allow to remove and event listener, and it will not trigger when called', function ( done ) {
      var eventEmitter = new EventEmitter();
      var called = false;
      var listener = eventEmitter.addEventListener('event', function ( event ) {
        called = true;
      });
      eventEmitter.removeEventListener( 'event', listener );
      var event = eventEmitter.createEvent('event')
      eventEmitter.dispatchEvent( event );
      setTimeout(function () {
          expect(called).to.be.false;
          done();
      });
    });

    it('should be possible to define a default Action that gets executed when an event is triggered', function ( done ) {
      var defaultCalled = false;
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        expect( event.phase ).to.equal( 1 );
      });
      var event = eventEmitter.createEvent('event', { defaultAction: function() { defaultCalled = true; } })
      eventEmitter.dispatchEvent( event );
      setTimeout(function() {
        expect( defaultCalled ).to.equal( true );
        done();
      });
    });

  it('should be possible to add an event before the default action gets called (capture phase)', function ( done ) {
      var defaultCalled = false;
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        expect( event.phase ).to.equal( 0 );
        expect( defaultCalled ).to.equal( false );
      }, true);
      var event = eventEmitter.createEvent('event', { defaultAction: function() { defaultCalled = true; } })
      eventEmitter.dispatchEvent( event );
      setTimeout(function() {
        expect( defaultCalled ).to.equal( true );
        done();
      });
    });

    it('should be possible to stop the default action from being called if the event is added on the capture phase', function ( done ) {
      var defaultCalled = false;
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        expect( event.phase ).to.equal( 0 );
        expect( defaultCalled ).to.equal( false );
        event.cancelDefault();
      }, true);
      var event = eventEmitter.createEvent('event', { defaultAction: function() { defaultCalled = true; } })
      eventEmitter.dispatchEvent( event );
      setTimeout(function() {
        expect( defaultCalled ).to.equal( false );
        done();
      });
    });

    it('should be possible to stop other event listeners from listening to the event when on capture stage', function ( done ) {
      var called1 = false;
      var called2 = false;
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        expect( called1 ).to.be.false;
        called1 = true;
        event.stopImmediatePropagation();

      }, true);
      eventEmitter.addEventListener('event', function ( event ) {
        expect( true ).to.be.false;
        called2 = true;
      }, true);
      var event = eventEmitter.createEvent('event', { defaultAction: function() {  } })
      eventEmitter.dispatchEvent( event );
      setTimeout(function() {
        expect( called1 ).to.be.true;
        expect( called2 ).to.be.false;
        done();
      });
    });

    it('should be possible to stop other event listeners from listening to the event when on bubbling stage', function ( done ) {
      var called1 = false;
      var called2 = false;
      var eventEmitter = new EventEmitter();
      eventEmitter.addEventListener('event', function ( event ) {
        expect( called1 ).to.be.false;
        called1 = true;
        event.stopImmediatePropagation();

      });
      eventEmitter.addEventListener('event', function ( event ) {
        expect( true ).to.be.false;
        called2 = true;
      });
      var event = eventEmitter.createEvent('event', { defaultAction: function() {  } })
      eventEmitter.dispatchEvent( event );
      setTimeout(function() {
        expect( called1 ).to.be.true;
        expect( called2 ).to.be.false;
        done();
      });
    });
  });
});