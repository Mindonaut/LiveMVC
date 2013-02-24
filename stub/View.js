
    var eventDetail = {},
        updateEvent = new CustomEvent( "update", { detail: eventDetail, bubbles: true }),
    // Creating the location custom event
        locationDetail = { data: {} },
        locationEvent = new CustomEvent( "setLocation", { detail: locationDetail, bubbles: true } );


    


Object.defineProperty( HTMLAnchorElement.prototype, "getData", {
        value: function() {
            var data = {},
                query = this.search.substring( 1 ),
                vars,
                i,
                keyValue,
                key,
                value;
            if ( query ) {
                vars = query.split("&");
                for ( i = 0; i < vars.length; i++ ) {
                    keyValue = vars[i].split("=");
                    key   = decodeURIComponent( keyValue[0] );
                    value = decodeURIComponent( keyValue[1] );
                    data[key] = value;
                }
            }
        },
        writable: false,
        enumerable: false,
        configurable: false
    });


    // Creating descritor for the getData method to be used on forms and fieldset elements;
    var getDataDescriptor = {
        value:function () {
            var data = {};
            for ( var i = 0; i < this.elements.length; i++ ) {
                var element = this.elements[i];
                // if the element has a name, and the parent element is the same as the form
                if ( element.parentElement === this && element.name ) {
                    // If the element is a fieldset
                    if ( element instanceof HTMLFieldSetElement ) {
                        data[element.name] = element.getData();
                    } else {
                        data[element.name] = element.value;
                    }
                }
            }
            return data;
        },
        writable:false,
        enumerable:false,
        configurable:false
    }
    // Adding data support to the form element
    Object.defineProperty(HTMLFormElement.prototype, "getData", getDataDescriptor);
    // Adding data support for the field set element
    Object.defineProperty(HTMLFieldSetElement.prototype, "getData", getDataDescriptor);


    // Adding generic HTML element new properties and methods
    Object.defineProperties(HTMLElement.prototype, {
        // All Html elements will have a view, except the body element, which is the top level element, and has not parent view
        view:{
            get:function() {
                // If my parent Node has a controller itself, then that is my view, otherwise, just the parent view
                if ( this.parentNode.controller ) {
                    return this.parentNode;
                } else if ( this !== document.body ){
                    return this.parentNode.view;
                } else {
                    return null;
                }
            },
            enumerable:true,
            configurable:false
        },
        base:{
            // the path by default, is the same as the parent node (if it exists), otherwise it is the location od the document
            get:function() {
                return (this.parentNode ? this.parentNode.base : View.currentBase) || View.currentBase;
            },
            set:function set(base) {
                Object.defineProperty(this, "base", {
                    value:base,
                    configurable:false,
                    writable:false
                });
            },
            enumerable:false,
            configurable:true
        },
        src:{
            //get:function() { return "" },
            set:function setSrc(url) {
                var absoluteUrl;
                if ( url.indexOf("http") === 0 ) {
                    absoluteUrl = url;
                } else {
                    absoluteUrl = getAbsoluteUrl(this.base, url);
                }


                var element = this;
                var xhr = new XMLHttpRequest();
                xhr.open("GET", absoluteUrl, true);
                xhr.onload = function(e) {
                    element.base = getBaseUrl(absoluteUrl);
                    element.setHtml(xhr.response);
                    element.update();
                }
                xhr.send("");
                Object.defineProperty(this, "src", {
                    get:function(){ return absoluteUrl },
                    set:setSrc,
                    configurable:true
                });
            },
            get:function() {
                return "";
            },
            enumerable:false,
            configurable:true
        },
        importChildNodes:{
            value:function(element) {
                while ( this.lastChild ) this.removeChild(this.lastChild);
                var fragment = document.createDocumentFragment();
                while ( element.firstChild ) fragment.appendChild(element.firstChild);
                this.appendChild(fragment);
                this.update();
            },
            enumerable:true,
            configurable:false
        },
        update:{
            value:function() {
                // Creating location listener
                function setLocationListener(event) {
                    // If the location requested is not an absolute url
                    var location = this.getAttribute('href') || this.getAttribute('action');
                    if ( !location.match(/^\w+:\/\//) ) {
                        event.preventDefault();
                        //console.log('responded to the click event!', location);
                        locationDetail.data = this.getData();
                        this.dispatchEvent(locationEvent);
                    }
                }

                var anchors = this.querySelectorAll('a');  // updating anchors to event
                for ( var i = 0; i < anchors.length; i++ ) {
                    anchors[i].addEventListener('click', setLocationListener);
                }

                var forms = this.querySelectorAll('form');  // updating forms to event
                for ( var i = 0; i < forms.length; i++ ) {
                    forms[i].addEventListener('submit', setLocationListener);
                }

                var srcElements = this.querySelectorAll('*[src]'); // Processing elements with src attributes
                for ( var i = 0; i < srcElements.length; i++ ) {
                    var element = srcElements[i];

                    var src = getAbsoluteUrl(this.base, element.getAttribute("src"))  // Make relative urls relative to the parent element base url
                    element.setAttribute("src", src);

                    if ( !(element instanceof HTMLImageElement || element instanceof HTMLScriptElement || element instanceof HTMLStyleElement) ) // Load content for non image/script/style tags
                    {
                        element.src = src;
                    }
                    else if ( element instanceof HTMLStyleElement )
                    {
                        this.removeAttribute("src");
                    }
                }
                // Converting script tags to be inline
                var scripts = this.querySelectorAll('script');
                for ( var i = 0; i < scripts.length; i++ ) {
                    var script = scripts[i];
                    var id = "_"+String(Math.random).substr(2,5);
                    script.id = id;
                    if ( !script.getAttribute("src") ) {
                        script.innerText = "document.runInline('"+script.innerText.replace("'","\\'")+"', "+id+")";
                    }
                }

                // Converting style tags to be inline
                var styles = this.querySelectorAll('style');
                for ( var i = 0; i < scripts.length; i++ ) {
                    var style = styles[i];
                    var id = "_"+String(Math.random).substr(2,5);
                    if ( !style.getAttribute("src") ) {
                        var script = document.createElement("script");
                        script.id = id;
                        script.innerText = "document.inlineStyle('"+style.innerText.replace("'","\\'")+"', "+id+")";
                        style.parentNode.replaceChild(script, style);
                    }
                }
            },
            enumerable:false,
            configurable:false
        },
        setHtml:{
            value:function(html) {
                var commentPlaceHolder = document.createComment('comment');
                this.parentNode.replaceChild(commentPlaceHolder, this);
                this.innerHtml = html;
                this.update();
                commentPlaceHolder.parentNode.replaceChild(this, commentPlaceHolder);
                // dispatching update event
                this.dispatchEvent(updateEvent);
            },
            enumerable:false,
            configurable:false
        }
    });


    var sourceTagsRegexp = /<(\w+)\s+.*src=["']([\w\.\/:\\]+)["'].*>/gi;
    var srcAttributeRegexp = /src=["'][\w\.\/:\\]+["']/i;
    var elementsRegexp = /<(script|style)\b[^>]*>([\s\S]*)<\/\1>/gi;
    var cssRuleRegexp = /([^{]*)(\{[^}]+\})/gm;


    document.runInline = function(script, id) {
        (new Function(script)).apply(document.getElementById(id).parentNode);
    }

    document.loadInline = function(url, id) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", absoluteUrl, true);
        xhr.onload = function(e) {
            document.runInline(xhr.response);
        }
        xhr.send("");
    }
    document.inlineStyle = function(content, id) {
        content.replace(cssRuleRegexp, function (match, selector, rule) {
            return "#" + id + " " + selector + rule;
        })
        var style = document.createElement('style');
        var script = document.querySelector("script[id='"+id+"']");
        var element = script.parentNode;


    }


    function getAbsoluteUrl(currentBase, url) {
        var absoluteUrl;
        // If the path set starts with a "/", it means the path is relative to the root of the site
        if ( url.indexOf('/') === 0 ) {
            absoluteUrl = location.origin+url;
        // If it is otherwise relative, replace the dot for the current path
        } else if ( url.indexOf('./') === 0 ) {
            absoluteUrl = currentBase+url.substring(1);
        // If it is going url directory up, then remove one level from the currentBase and append the rest of the relative path without the ".."
        } else if ( url.indexOf('../') === 0 ) {
            absoluteUrl = getAbsoluteUrl(getBaseUrl(currentBase))+url.substring(2);
        // if it is a relative path without ./
        } else if ( url.match(/^\w/) ) {
            absoluteUrl = currentBase+'/'+url;
        // else we assume the path is a full path already (that includes the domain name)
        } else {
            absoluteUrl = url;
        }
        return absoluteUrl;
    }

    function getBaseUrl(url) {
        return url.match(/(^\/?(?:.+\/?)*)\/(?:.+)(?:\.(?:.+))?$/)[1];
    }
