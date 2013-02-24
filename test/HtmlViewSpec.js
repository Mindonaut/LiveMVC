define(function( require ) {
  var HtmlView = require("HtmlView");

  describe('Html View tests', function () {

    it('When instantiating an Html View with no element, should assume the body element', function () {
      var view = new HtmlView();
      expect(view.element).to.equal(document.body);
    });


    it('should be possible to subscribe to any other event of the underlying element', function ( done ) {
      var view = new HtmlView();
      view.addEventListener('click', function() {
        done();
      });
      view.click();
    });

    it('should be possible to read any property, or call any method of the underlying element directly on the view', function () {
      var element = document.createElement('div');
      var view = new HtmlView(element);
      expect( element.childNodes ).to.equal( view.childNodes );
      expect( element.firstChild ).to.equal( view.firstChild );
      expect( element.type ).to.equal( view.type );
      view.textContent = 'Hello world';
      expect( element.textContent ).to.equal( 'Hello world' );
      var child = document.createElement('span');
      view.appendChild(child)
      expect( element.lastChild ).to.equal( child );

    });

    it('should be possible to get a view list containing the views, for the selector', function () {
      var view = new HtmlView();
      var element = document.createElement('element');
      view.appendChild(element);
      var viewList = view.getChildren('element');
      expect( viewList[0].element ).to.equal( element );
      view.removeChild(element);
    });

    it('should be possible to subscribe to the addView event on a view list', function ( done ) {
      var view = new HtmlView();
      var viewList = view.getChildren('element');
      var element = document.createElement('element');
      viewList.addEventListener('addView', function(event) {
        expect(event.arguments[0]).to.be.instanceof(HtmlView);
        expect(event.arguments[0].element).to.equal(element);
        view.removeChild(element);
        done();
      });
      view.appendChild(element);
    });

    xit('should be possible to subscribe to the removeView event on a view list', function ( done ) {
      var view = new HtmlView();
      view.addEventListener('removeView', function() {
        done();
      });
      view.removeView(view);
    });
    
    
    xit('should be possible to have the onload/oninit event to apply on new elements', function () {

    });

    xit('should be possible to have view scoped stylesheets', function () {

    });

    xit('should be possible to have view scoped scripts', function () {

    });

    xit('should be possible to process the onLoad event for those elements in the view that possess the attribute', function () {

    });

    xit('should be possible to load an external Html File', function () {

    });
  });
});