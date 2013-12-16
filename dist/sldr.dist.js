;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-pad/index.js", function(exports, require, module){

/**
 * Expose `pad()`.
 */

exports = module.exports = pad;

/**
 * Pad `str` to `len` with optional `c` char,
 * favoring the left when unbalanced.
 *
 * @param {String} str
 * @param {Number} len
 * @param {String} c
 * @return {String}
 * @api public
 */

function pad(str, len, c) {
  c = c || ' ';
  if (str.length >= len) return str;
  len = len - str.length;
  var left = Array(Math.ceil(len / 2) + 1).join(c);
  var right = Array(Math.floor(len / 2) + 1).join(c);
  return left + str + right;
}

/**
 * Pad `str` left to `len` with optional `c` char.
 *
 * @param {String} str
 * @param {Number} len
 * @param {String} c
 * @return {String}
 * @api public
 */

exports.left = function(str, len, c){
  c = c || ' ';
  if (str.length >= len) return str;
  return Array(len - str.length + 1).join(c) + str;
};

/**
 * Pad `str` right to `len` with optional `c` char.
 *
 * @param {String} str
 * @param {Number} len
 * @param {String} c
 * @return {String}
 * @api public
 */

exports.right = function(str, len, c){
  c = c || ' ';
  if (str.length >= len) return str;
  return str + Array(len - str.length + 1).join(c);
};
});
require.register("component-query/index.js", function(exports, require, module){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // Note: when moving children, don't rely on el.children
  // being 'live' to support Polymer's broken behaviour.
  // See: https://github.com/component/domify/pull/23
  if (1 == el.children.length) {
    return el.removeChild(el.children[0]);
  }

  var fragment = document.createDocumentFragment();
  while (el.children.length) {
    fragment.appendChild(el.removeChild(el.children[0]));
  }

  return fragment;
}

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("discore-closest/index.js", function(exports, require, module){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return  
  }
}
});
require.register("component-delegate/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var closest = require('closest')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

});
require.register("component-events/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var events = require('event');
var delegate = require('delegate');

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

});
require.register("component-has-translate3d/index.js", function(exports, require, module){

var prop = require('transform-property');
// IE8<= doesn't have `getComputedStyle`
if (!prop || !window.getComputedStyle) return module.exports = false;

var map = {
  webkitTransform: '-webkit-transform',
  OTransform: '-o-transform',
  msTransform: '-ms-transform',
  MozTransform: '-moz-transform',
  transform: 'transform'
};

// from: https://gist.github.com/lorenzopolidori/3794226
var el = document.createElement('div');
el.style[prop] = 'translate3d(1px,1px,1px)';
document.body.insertBefore(el, null);
var val = getComputedStyle(el).getPropertyValue(map[prop]);
document.body.removeChild(el);
module.exports = null != val && val.length && 'none' != val;

});
require.register("component-transform-property/index.js", function(exports, require, module){

var styles = [
  'webkitTransform',
  'MozTransform',
  'msTransform',
  'OTransform',
  'transform'
];

var el = document.createElement('p');
var style;

for (var i = 0; i < styles.length; i++) {
  style = styles[i];
  if (null != el.style[style]) {
    module.exports = style;
    break;
  }
}

});
require.register("mnmly-translate/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var transform = require('transform-property');
var has3d = require('has-translate3d');


/**
 * Regexp to check "End with %"
 */

var percentRegexp = /%$/;


/**
 * Expose `translate`.
 */

module.exports = translate;


/**
 * Translate `el` by `(x, y)`.
 *
 * @param {Element} el
 * @param {Number|String} x
 * @param {Number|String} y 
 * @api public
 */


function translate(el, x, y){
  
  if (!percentRegexp.test(x)) x += 'px';
  if (!percentRegexp.test(y)) y += 'px';

  if (transform) {
    if (has3d) {
      el.style[transform] = 'translate3d(' + x + ', ' + y + ', 0)';
    } else {
      el.style[transform] = 'translate(' + x + ',' + y + ')';
    }
  } else {
    el.style.left = x;
    el.style.top = y;
  }
};

});
require.register("mnmly-constrain/index.js", function(exports, require, module){
/**
 * Expose `constrain`
 */

module.exports = constrain;

/**
  * Constrains a value to not exceed a maximum and minimum value.
  *
  * @param {int|float} value   the value to constrain
  * @param {int|float} value   minimum limit
  * @param {int|float} value   maximum limit
  *
  * @returns {int|float}
  */

function constrain( aNumber, aMin, aMax ) {
  return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;
};

});
require.register("sldr/index.js", function(exports, require, module){
/**
* Module dependencies
 */

var pad = require('pad');
var query = require('query');
var domify = require('domify');
var events = require('events');
var Emitter = require('emitter');
var translate = require('translate');
var constrain = require('constrain');
var template = require('./template');


/**
 * Expose `Sldr`
 */

module.exports = Sldr;


/**
 * Initialize `Sldr`
 *
 * @param {Number} initial value (Optional)
 * @param {Number} min value (Optional)
 * @param {Number} max value (Optional)
 *
 */

function Sldr(value, min, max){

  this.el = domify(this.template);
  this.wrapEl = query('.wrap', this.el);
  this.valueEl = query('.label-value', this.el);
  this.gaugeEl = query('.gauge', this.el);
  this.minEl = query('.label-min', this.el);
  this.maxEl = query('.label-max', this.el);
  
  this._min = min || 0;
  this._max = max || 100;
  this._value = constrain(value || 0, this._min, this._max);

  this.bind();
}

/**
 * Emitter
 */

Emitter(Sldr.prototype);


/**
 * Template
 */

Sldr.prototype.template = template;

/**
 * Bind dom events
 *
 * @api private
 */

Sldr.prototype.bind = function() {
  this.events = events(this.el, this);
  this.bodyEvents = events(document.body, this);
  this.events.bind('mousedown', 'touchstart');
  this.events.bind('touchstart', 'touchstart');
};


/**
 * Unbind all the DOM events and remove all the listeners
 * @api private
 */

Sldr.prototype.unbind = function() {
  this.events.unbind();
  this.bodyEvents.unbind();
  this.off();
};

/**
 * Mousedown or touchstart event handler
 * @param {Event}
 * 
 * @api private
 */

Sldr.prototype.touchstart = function(e) {
  e.preventDefault();

  this._width = this.el.clientWidth;
  this._left = this.el.offsetLeft;

  var percentage = constrain((e.pageX - this._left) / this._width, 0, 100);
  this.value(percentage * (this._max - this._min));

  this.bodyEvents.bind('mousemove', 'touchmove');
  this.bodyEvents.bind('mouseup', 'touchend');
  this.bodyEvents.bind('touchmove', 'touchmove');
  this.bodyEvents.bind('touchend', 'touchend');

};


/**
 * Mousemove or touchmove event handler bound to body
 * @param {Event}
 * 
 * @api private
 */

Sldr.prototype.touchmove = function(e) {
  e.preventDefault();
  this.el.classList.add('is-active');
  var percentage = constrain((e.pageX - this._left) / this._width, 0, 100);
  this.value(percentage * (this._max - this._min));
};


/**
 * Mouseup or touchend event handler bound to body
 * @param {Event}
 * 
 * @api private
 */

Sldr.prototype.touchend = function(e) {
  e.preventDefault();
  this.el.classList.remove('is-active');
  this.bodyEvents.unbind();
};


/**
 * Position value label
 *
 * @api private
 */

Sldr.prototype.positionLabel = function() {

  if(!this._width) this._width = this.el.clientWidth;

  var w = this.valueEl.clientWidth;
  var x = 0;
  var padding = 20;
  var offset = this.percentage() / 100 * this._width;
  
  // Check if there's enough room for label to be in
  if(w + padding < offset){
    this.valueEl.classList.remove('is-close-zero');
    x = offset - w - padding / 2;
  } else {
    this.valueEl.classList.add('is-close-zero');
    x = offset + padding / 2;
  }
  translate(this.valueEl, x, 0);

};


/**
 * Get or set `value`
 *
 * @param {Number} value to set
 * @api public
 */

Sldr.prototype.value = function(val) {
  if (arguments.length) {
    this._value = constrain(val, this._min, this._max);
    this.update();
    this.emit('change', this._value);
  } else {
    return this._value;
  }
};


/**
 * Get or set `min` for range.
 *
 * @param {Number} min value to set
 * @api public
 */

Sldr.prototype.min = function(val) {
  if (arguments.length) {
    this._min = val;
    this.update();
  } else {
    return this._min;
  }
};

/**
 * Get or set `max` for range.
 *
 * @param {Number} max value to set
 * @api public
 */

Sldr.prototype.max = function(val) {
  if (arguments.length) {
    this._max = val;
    this.update();
  } else {
    return this._max;
  }
};

/**
 * Update DOM Elements
 *
 * @api private
 */

Sldr.prototype.update = function() {
  
  // Update value;
  this.valueEl.innerText = this.format(this._value);
  this.positionLabel();

  // Update gauge
  var x = -(100 - this.percentage()) + '%';
  translate(this.gaugeEl, x, 0);

  // Update min / max
  this.minEl.innerText = this.format(this._min);
  this.maxEl.innerText = this.format(this._max);

};

/**
 * Returns the percentage of current value in the range of `min`, `max`
 *
 * @api public
 */

Sldr.prototype.percentage = function(v) {
  v = v || this._value;
  return (this._value - this._min) / (this._max - this._min) * 100;
};

/**
 * Format values for labels
 *
 * @param {Number} value to format
 * @return {String}
 *
 * @api public
 */

Sldr.prototype.format = function(v){
  var val = '' + Math.round( v * 100 ) / 100;
  if(!/\./.test(val)) val += '.00';
  return val;
}

/**
 * Destroy `Sldr` instance
 *
 * @api public
 */

Sldr.prototype.destroy = function() {
  this.unbind();
  this.el.parentElement && this.el.parentElement.removeChild(this.el);
  this.el = null;
};

});
require.register("sldr/template.js", function(exports, require, module){
module.exports = '<div class="sldr">\n  <div class="wrap">\n    <div class="label-value"></div>\n    <div class="gauge"></div>\n  </div>\n  <div class="label-wrap">\n    <span class="label-min"></span><span class="label-max"></span>\n  </div>\n</div>\n';
});


















require.alias("component-pad/index.js", "sldr/deps/pad/index.js");
require.alias("component-pad/index.js", "pad/index.js");

require.alias("component-query/index.js", "sldr/deps/query/index.js");
require.alias("component-query/index.js", "query/index.js");

require.alias("component-domify/index.js", "sldr/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("component-emitter/index.js", "sldr/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-events/index.js", "sldr/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("mnmly-translate/index.js", "sldr/deps/translate/index.js");
require.alias("mnmly-translate/index.js", "sldr/deps/translate/index.js");
require.alias("mnmly-translate/index.js", "translate/index.js");
require.alias("component-has-translate3d/index.js", "mnmly-translate/deps/has-translate3d/index.js");
require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");

require.alias("component-transform-property/index.js", "mnmly-translate/deps/transform-property/index.js");

require.alias("mnmly-translate/index.js", "mnmly-translate/index.js");
require.alias("mnmly-constrain/index.js", "sldr/deps/constrain/index.js");
require.alias("mnmly-constrain/index.js", "constrain/index.js");

require.alias("sldr/index.js", "sldr/index.js");if (typeof exports == "object") {
  module.exports = require("sldr");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("sldr"); });
} else {
  this["Sldr"] = require("sldr");
}})();