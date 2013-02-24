var fs = require('fs');
var path = require('path');
var http = require('http');

http.createServer(function ( request, response ) {
    if ( request.url == "/favicon.ico" ) return response.end();
    //console.log('requesting ', request.url);
    var filePath = '.' + request.url.split("?")[0];
    if ( filePath == './' )
        filePath = './index.html';

    var extname = path.extname( filePath );
    var contentTypes = { '.js': 'text/javascript', '.css': 'text/css' };
    var contentType = contentTypes[extname] || 'text/html';

    fs.exists( filePath, function( exists ) {
        if ( exists ) {
            console.log("Serving file:", filePath );
            fs.readFile(filePath, function( error, content ) {
                if ( error ) {
                    response.writeHead( 500 );
                    response.end();
                }
                else {
                    response.writeHead( 200, { 'Content-Type': contentType } );
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            console.log( "File not found:", filePath );
            response.writeHead(404);
            response.end();
        }
    });

}).listen(process.env.PORT);
console.log("Listening...");



/*

view = new view()
controller.listenOn(view)
controller = new SubController(view)

but a view, might event out multiple views.views

So if we do something like:

liveMvc
distributed, real-time, flexible, extendable, loosely coupled, easy to understand, poweful
easy to extend

livemvc ControllerName viewName modelName

The model, really represent only one event Emitter, however there might be multiple views... so there has to be a pattern to add mutliple views, easily.

In the client, defining one view, is easy, but a group of views, not so much. We need a mechanism to setup multiple names, like a ControllerGroup(), A controller Group (The same way we have a view array)

The controller Group receives the model, the view, but also the Constructor function. Also, the view Group, events out every time there is a new view, matching the criteria.
Alternativelly, controllers can listen on multiple views, of the same type. In this case, it would be hard to keep a state, since the controller would need to handle multiple functions

*/








