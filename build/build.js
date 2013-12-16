
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
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Expose `Events`.\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
/**\n\
 * Initialize an `Events` with the given\n\
 * `el` object which events will be bound to,\n\
 * and the `obj` which will receive method calls.\n\
 *\n\
 * @param {Object} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Events(el, obj) {\n\
  if (!(this instanceof Events)) return new Events(el, obj);\n\
  if (!el) throw new Error('element required');\n\
  if (!obj) throw new Error('object required');\n\
  this.el = el;\n\
  this.obj = obj;\n\
  this._events = {};\n\
}\n\
\n\
/**\n\
 * Subscription helper.\n\
 */\n\
\n\
Events.prototype.sub = function(event, method, cb){\n\
  this._events[event] = this._events[event] || {};\n\
  this._events[event][method] = cb;\n\
};\n\
\n\
/**\n\
 * Bind to `event` with optional `method` name.\n\
 * When `method` is undefined it becomes `event`\n\
 * with the \"on\" prefix.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Direct event handling:\n\
 *\n\
 *    events.bind('click') // implies \"onclick\"\n\
 *    events.bind('click', 'remove')\n\
 *    events.bind('click', 'sort', 'asc')\n\
 *\n\
 *  Delegated event handling:\n\
 *\n\
 *    events.bind('click li > a')\n\
 *    events.bind('click li > a', 'remove')\n\
 *    events.bind('click a.sort-ascending', 'sort', 'asc')\n\
 *    events.bind('click a.sort-descending', 'sort', 'desc')\n\
 *\n\
 * @param {String} event\n\
 * @param {String|function} [method]\n\
 * @return {Function} callback\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.bind = function(event, method){\n\
  var e = parse(event);\n\
  var el = this.el;\n\
  var obj = this.obj;\n\
  var name = e.name;\n\
  var method = method || 'on' + name;\n\
  var args = [].slice.call(arguments, 2);\n\
\n\
  // callback\n\
  function cb(){\n\
    var a = [].slice.call(arguments).concat(args);\n\
    obj[method].apply(obj, a);\n\
  }\n\
\n\
  // bind\n\
  if (e.selector) {\n\
    cb = delegate.bind(el, e.selector, name, cb);\n\
  } else {\n\
    events.bind(el, name, cb);\n\
  }\n\
\n\
  // subscription for unbinding\n\
  this.sub(name, method, cb);\n\
\n\
  return cb;\n\
};\n\
\n\
/**\n\
 * Unbind a single binding, all bindings for `event`,\n\
 * or all bindings within the manager.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Unbind direct handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * Unbind delegate handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * @param {String|Function} [event]\n\
 * @param {String|Function} [method]\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.unbind = function(event, method){\n\
  if (0 == arguments.length) return this.unbindAll();\n\
  if (1 == arguments.length) return this.unbindAllOf(event);\n\
\n\
  // no bindings for this event\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  // no bindings for this method\n\
  var cb = bindings[method];\n\
  if (!cb) return;\n\
\n\
  events.unbind(this.el, event, cb);\n\
};\n\
\n\
/**\n\
 * Unbind all events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAll = function(){\n\
  for (var event in this._events) {\n\
    this.unbindAllOf(event);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind all events for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAllOf = function(event){\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  for (var method in bindings) {\n\
    this.unbind(event, method);\n\
  }\n\
};\n\
\n\
/**\n\
 * Parse `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parse(event) {\n\
  var parts = event.split(/ +/);\n\
  return {\n\
    name: parts.shift(),\n\
    selector: parts.join(' ')\n\
  }\n\
}\n\
//@ sourceURL=component-events/index.js"
));
require.register("component-has-translate3d/index.js", Function("exports, require, module",
"\n\
var prop = require('transform-property');\n\
// IE8<= doesn't have `getComputedStyle`\n\
if (!prop || !window.getComputedStyle) return module.exports = false;\n\
\n\
var map = {\n\
  webkitTransform: '-webkit-transform',\n\
  OTransform: '-o-transform',\n\
  msTransform: '-ms-transform',\n\
  MozTransform: '-moz-transform',\n\
  transform: 'transform'\n\
};\n\
\n\
// from: https://gist.github.com/lorenzopolidori/3794226\n\
var el = document.createElement('div');\n\
el.style[prop] = 'translate3d(1px,1px,1px)';\n\
document.body.insertBefore(el, null);\n\
var val = getComputedStyle(el).getPropertyValue(map[prop]);\n\
document.body.removeChild(el);\n\
module.exports = null != val && val.length && 'none' != val;\n\
//@ sourceURL=component-has-translate3d/index.js"
));
require.register("component-transform-property/index.js", Function("exports, require, module",
"\n\
var styles = [\n\
  'webkitTransform',\n\
  'MozTransform',\n\
  'msTransform',\n\
  'OTransform',\n\
  'transform'\n\
];\n\
\n\
var el = document.createElement('p');\n\
var style;\n\
\n\
for (var i = 0; i < styles.length; i++) {\n\
  style = styles[i];\n\
  if (null != el.style[style]) {\n\
    module.exports = style;\n\
    break;\n\
  }\n\
}\n\
//@ sourceURL=component-transform-property/index.js"
));
require.register("mnmly-translate/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var transform = require('transform-property');\n\
var has3d = require('has-translate3d');\n\
\n\
\n\
/**\n\
 * Regexp to check \"End with %\"\n\
 */\n\
\n\
var percentRegexp = /%$/;\n\
\n\
\n\
/**\n\
 * Expose `translate`.\n\
 */\n\
\n\
module.exports = translate;\n\
\n\
\n\
/**\n\
 * Translate `el` by `(x, y)`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Number|String} x\n\
 * @param {Number|String} y \n\
 * @api public\n\
 */\n\
\n\
\n\
function translate(el, x, y){\n\
  \n\
  if (!percentRegexp.test(x)) x += 'px';\n\
  if (!percentRegexp.test(y)) y += 'px';\n\
\n\
  if (transform) {\n\
    if (has3d) {\n\
      el.style[transform] = 'translate3d(' + x + ', ' + y + ', 0)';\n\
    } else {\n\
      el.style[transform] = 'translate(' + x + ',' + y + ')';\n\
    }\n\
  } else {\n\
    el.style.left = x;\n\
    el.style.top = y;\n\
  }\n\
};\n\
//@ sourceURL=mnmly-translate/index.js"
));
require.register("mnmly-constrain/index.js", Function("exports, require, module",
"/**\n\
 * Expose `constrain`\n\
 */\n\
\n\
module.exports = constrain;\n\
\n\
/**\n\
  * Constrains a value to not exceed a maximum and minimum value.\n\
  *\n\
  * @param {int|float} value   the value to constrain\n\
  * @param {int|float} value   minimum limit\n\
  * @param {int|float} value   maximum limit\n\
  *\n\
  * @returns {int|float}\n\
  */\n\
\n\
function constrain( aNumber, aMin, aMax ) {\n\
  return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;\n\
};\n\
//@ sourceURL=mnmly-constrain/index.js"
));
require.register("chaijs-assertion-error/index.js", Function("exports, require, module",
"/*!\n\
 * assertion-error\n\
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Return a function that will copy properties from\n\
 * one object to another excluding any originally\n\
 * listed. Returned function will create a new `{}`.\n\
 *\n\
 * @param {String} excluded properties ...\n\
 * @return {Function}\n\
 */\n\
\n\
function exclude () {\n\
  var excludes = [].slice.call(arguments);\n\
\n\
  function excludeProps (res, obj) {\n\
    Object.keys(obj).forEach(function (key) {\n\
      if (!~excludes.indexOf(key)) res[key] = obj[key];\n\
    });\n\
  }\n\
\n\
  return function extendExclude () {\n\
    var args = [].slice.call(arguments)\n\
      , i = 0\n\
      , res = {};\n\
\n\
    for (; i < args.length; i++) {\n\
      excludeProps(res, args[i]);\n\
    }\n\
\n\
    return res;\n\
  };\n\
};\n\
\n\
/*!\n\
 * Primary Exports\n\
 */\n\
\n\
module.exports = AssertionError;\n\
\n\
/**\n\
 * ### AssertionError\n\
 *\n\
 * An extension of the JavaScript `Error` constructor for\n\
 * assertion and validation scenarios.\n\
 *\n\
 * @param {String} message\n\
 * @param {Object} properties to include (optional)\n\
 * @param {callee} start stack function (optional)\n\
 */\n\
\n\
function AssertionError (message, _props, ssf) {\n\
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')\n\
    , props = extend(_props || {});\n\
\n\
  // default values\n\
  this.message = message || 'Unspecified AssertionError';\n\
  this.showDiff = false;\n\
\n\
  // copy from properties\n\
  for (var key in props) {\n\
    this[key] = props[key];\n\
  }\n\
\n\
  // capture stack trace\n\
  ssf = ssf || arguments.callee;\n\
  if (ssf && Error.captureStackTrace) {\n\
    Error.captureStackTrace(this, ssf);\n\
  }\n\
}\n\
\n\
/*!\n\
 * Inherit from Error.prototype\n\
 */\n\
\n\
AssertionError.prototype = Object.create(Error.prototype);\n\
\n\
/*!\n\
 * Statically set name\n\
 */\n\
\n\
AssertionError.prototype.name = 'AssertionError';\n\
\n\
/*!\n\
 * Ensure correct constructor\n\
 */\n\
\n\
AssertionError.prototype.constructor = AssertionError;\n\
\n\
/**\n\
 * Allow errors to be converted to JSON for static transfer.\n\
 *\n\
 * @param {Boolean} include stack (default: `true`)\n\
 * @return {Object} object that can be `JSON.stringify`\n\
 */\n\
\n\
AssertionError.prototype.toJSON = function (stack) {\n\
  var extend = exclude('constructor', 'toJSON', 'stack')\n\
    , props = extend({ name: this.name }, this);\n\
\n\
  // include stack if exists and not turned off\n\
  if (false !== stack && this.stack) {\n\
    props.stack = this.stack;\n\
  }\n\
\n\
  return props;\n\
};\n\
//@ sourceURL=chaijs-assertion-error/index.js"
));
require.register("chaijs-type-detect/lib/type.js", Function("exports, require, module",
"/*!\n\
 * type-detect\n\
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Primary Exports\n\
 */\n\
\n\
var exports = module.exports = getType;\n\
\n\
/*!\n\
 * Detectable javascript natives\n\
 */\n\
\n\
var natives = {\n\
    '[object Array]': 'array'\n\
  , '[object RegExp]': 'regexp'\n\
  , '[object Function]': 'function'\n\
  , '[object Arguments]': 'arguments'\n\
  , '[object Date]': 'date'\n\
};\n\
\n\
/**\n\
 * ### typeOf (obj)\n\
 *\n\
 * Use several different techniques to determine\n\
 * the type of object being tested.\n\
 *\n\
 *\n\
 * @param {Mixed} object\n\
 * @return {String} object type\n\
 * @api public\n\
 */\n\
\n\
function getType (obj) {\n\
  var str = Object.prototype.toString.call(obj);\n\
  if (natives[str]) return natives[str];\n\
  if (obj === null) return 'null';\n\
  if (obj === undefined) return 'undefined';\n\
  if (obj === Object(obj)) return 'object';\n\
  return typeof obj;\n\
}\n\
\n\
exports.Library = Library;\n\
\n\
/**\n\
 * ### Library\n\
 *\n\
 * Create a repository for custom type detection.\n\
 *\n\
 * ```js\n\
 * var lib = new type.Library;\n\
 * ```\n\
 *\n\
 */\n\
\n\
function Library () {\n\
  this.tests = {};\n\
}\n\
\n\
/**\n\
 * #### .of (obj)\n\
 *\n\
 * Expose replacement `typeof` detection to the library.\n\
 *\n\
 * ```js\n\
 * if ('string' === lib.of('hello world')) {\n\
 *   // ...\n\
 * }\n\
 * ```\n\
 *\n\
 * @param {Mixed} object to test\n\
 * @return {String} type\n\
 */\n\
\n\
Library.prototype.of = getType;\n\
\n\
/**\n\
 * #### .define (type, test)\n\
 *\n\
 * Add a test to for the `.test()` assertion.\n\
 *\n\
 * Can be defined as a regular expression:\n\
 *\n\
 * ```js\n\
 * lib.define('int', /^[0-9]+$/);\n\
 * ```\n\
 *\n\
 * ... or as a function:\n\
 *\n\
 * ```js\n\
 * lib.define('bln', function (obj) {\n\
 *   if ('boolean' === lib.of(obj)) return true;\n\
 *   var blns = [ 'yes', 'no', 'true', 'false', 1, 0 ];\n\
 *   if ('string' === lib.of(obj)) obj = obj.toLowerCase();\n\
 *   return !! ~blns.indexOf(obj);\n\
 * });\n\
 * ```\n\
 *\n\
 * @param {String} type\n\
 * @param {RegExp|Function} test\n\
 * @api public\n\
 */\n\
\n\
Library.prototype.define = function (type, test) {\n\
  if (arguments.length === 1) return this.tests[type];\n\
  this.tests[type] = test;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * #### .test (obj, test)\n\
 *\n\
 * Assert that an object is of type. Will first\n\
 * check natives, and if that does not pass it will\n\
 * use the user defined custom tests.\n\
 *\n\
 * ```js\n\
 * assert(lib.test('1', 'int'));\n\
 * assert(lib.test('yes', 'bln'));\n\
 * ```\n\
 *\n\
 * @param {Mixed} object\n\
 * @param {String} type\n\
 * @return {Boolean} result\n\
 * @api public\n\
 */\n\
\n\
Library.prototype.test = function (obj, type) {\n\
  if (type === getType(obj)) return true;\n\
  var test = this.tests[type];\n\
\n\
  if (test && 'regexp' === getType(test)) {\n\
    return test.test(obj);\n\
  } else if (test && 'function' === getType(test)) {\n\
    return test(obj);\n\
  } else {\n\
    throw new ReferenceError('Type test \"' + type + '\" not defined or invalid.');\n\
  }\n\
};\n\
//@ sourceURL=chaijs-type-detect/lib/type.js"
));
require.register("chaijs-deep-eql/lib/eql.js", Function("exports, require, module",
"/*!\n\
 * deep-eql\n\
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Module dependencies\n\
 */\n\
\n\
var type = require('type-detect');\n\
\n\
/*!\n\
 * Buffer.isBuffer browser shim\n\
 */\n\
\n\
var Buffer;\n\
try { Buffer = require('buffer').Buffer; }\n\
catch(ex) {\n\
  Buffer = {};\n\
  Buffer.isBuffer = function() { return false; }\n\
}\n\
\n\
/*!\n\
 * Primary Export\n\
 */\n\
\n\
module.exports = deepEqual;\n\
\n\
/**\n\
 * Assert super-strict (egal) equality between\n\
 * two objects of any type.\n\
 *\n\
 * @param {Mixed} a\n\
 * @param {Mixed} b\n\
 * @param {Array} memoised (optional)\n\
 * @return {Boolean} equal match\n\
 */\n\
\n\
function deepEqual(a, b, m) {\n\
  if (sameValue(a, b)) {\n\
    return true;\n\
  } else if ('date' === type(a)) {\n\
    return dateEqual(a, b);\n\
  } else if ('regexp' === type(a)) {\n\
    return regexpEqual(a, b);\n\
  } else if (Buffer.isBuffer(a)) {\n\
    return bufferEqual(a, b);\n\
  } else if ('arguments' === type(a)) {\n\
    return argumentsEqual(a, b, m);\n\
  } else if (!typeEqual(a, b)) {\n\
    return false;\n\
  } else if (('object' !== type(a) && 'object' !== type(b))\n\
  && ('array' !== type(a) && 'array' !== type(b))) {\n\
    return sameValue(a, b);\n\
  } else {\n\
    return objectEqual(a, b, m);\n\
  }\n\
}\n\
\n\
/*!\n\
 * Strict (egal) equality test. Ensures that NaN always\n\
 * equals NaN and `-0` does not equal `+0`.\n\
 *\n\
 * @param {Mixed} a\n\
 * @param {Mixed} b\n\
 * @return {Boolean} equal match\n\
 */\n\
\n\
function sameValue(a, b) {\n\
  if (a === b) return a !== 0 || 1 / a === 1 / b;\n\
  return a !== a && b !== b;\n\
}\n\
\n\
/*!\n\
 * Compare the types of two given objects and\n\
 * return if they are equal. Note that an Array\n\
 * has a type of `array` (not `object`) and arguments\n\
 * have a type of `arguments` (not `array`/`object`).\n\
 *\n\
 * @param {Mixed} a\n\
 * @param {Mixed} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function typeEqual(a, b) {\n\
  return type(a) === type(b);\n\
}\n\
\n\
/*!\n\
 * Compare two Date objects by asserting that\n\
 * the time values are equal using `saveValue`.\n\
 *\n\
 * @param {Date} a\n\
 * @param {Date} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function dateEqual(a, b) {\n\
  if ('date' !== type(b)) return false;\n\
  return sameValue(a.getTime(), b.getTime());\n\
}\n\
\n\
/*!\n\
 * Compare two regular expressions by converting them\n\
 * to string and checking for `sameValue`.\n\
 *\n\
 * @param {RegExp} a\n\
 * @param {RegExp} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function regexpEqual(a, b) {\n\
  if ('regexp' !== type(b)) return false;\n\
  return sameValue(a.toString(), b.toString());\n\
}\n\
\n\
/*!\n\
 * Assert deep equality of two `arguments` objects.\n\
 * Unfortunately, these must be sliced to arrays\n\
 * prior to test to ensure no bad behavior.\n\
 *\n\
 * @param {Arguments} a\n\
 * @param {Arguments} b\n\
 * @param {Array} memoize (optional)\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function argumentsEqual(a, b, m) {\n\
  if ('arguments' !== type(b)) return false;\n\
  a = [].slice.call(a);\n\
  b = [].slice.call(b);\n\
  return deepEqual(a, b, m);\n\
}\n\
\n\
/*!\n\
 * Get enumerable properties of a given object.\n\
 *\n\
 * @param {Object} a\n\
 * @return {Array} property names\n\
 */\n\
\n\
function enumerable(a) {\n\
  var res = [];\n\
  for (var key in a) res.push(key);\n\
  return res;\n\
}\n\
\n\
/*!\n\
 * Simple equality for flat iterable objects\n\
 * such as Arrays or Node.js buffers.\n\
 *\n\
 * @param {Iterable} a\n\
 * @param {Iterable} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function iterableEqual(a, b) {\n\
  if (a.length !==  b.length) return false;\n\
\n\
  var i = 0;\n\
  var match = true;\n\
\n\
  for (; i < a.length; i++) {\n\
    if (a[i] !== b[i]) {\n\
      match = false;\n\
      break;\n\
    }\n\
  }\n\
\n\
  return match;\n\
}\n\
\n\
/*!\n\
 * Extension to `iterableEqual` specifically\n\
 * for Node.js Buffers.\n\
 *\n\
 * @param {Buffer} a\n\
 * @param {Mixed} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function bufferEqual(a, b) {\n\
  if (!Buffer.isBuffer(b)) return false;\n\
  return iterableEqual(a, b);\n\
}\n\
\n\
/*!\n\
 * Block for `objectEqual` ensuring non-existing\n\
 * values don't get in.\n\
 *\n\
 * @param {Mixed} object\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function isValue(a) {\n\
  return a !== null && a !== undefined;\n\
}\n\
\n\
/*!\n\
 * Recursively check the equality of two objects.\n\
 * Once basic sameness has been established it will\n\
 * defer to `deepEqual` for each enumerable key\n\
 * in the object.\n\
 *\n\
 * @param {Mixed} a\n\
 * @param {Mixed} b\n\
 * @return {Boolean} result\n\
 */\n\
\n\
function objectEqual(a, b, m) {\n\
  if (!isValue(a) || !isValue(b)) {\n\
    return false;\n\
  }\n\
\n\
  if (a.prototype !== b.prototype) {\n\
    return false;\n\
  }\n\
\n\
  var i;\n\
  if (m) {\n\
    for (i = 0; i < m.length; i++) {\n\
      if ((m[i][0] === a && m[i][1] === b)\n\
      ||  (m[i][0] === b && m[i][1] === a)) {\n\
        return true;\n\
      }\n\
    }\n\
  } else {\n\
    m = [];\n\
  }\n\
\n\
  try {\n\
    var ka = enumerable(a);\n\
    var kb = enumerable(b);\n\
  } catch (ex) {\n\
    return false;\n\
  }\n\
\n\
  ka.sort();\n\
  kb.sort();\n\
\n\
  if (!iterableEqual(ka, kb)) {\n\
    return false;\n\
  }\n\
\n\
  m.push([ a, b ]);\n\
\n\
  var key;\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    key = ka[i];\n\
    if (!deepEqual(a[key], b[key], m)) {\n\
      return false;\n\
    }\n\
  }\n\
\n\
  return true;\n\
}\n\
//@ sourceURL=chaijs-deep-eql/lib/eql.js"
));
require.register("chaijs-chai/index.js", Function("exports, require, module",
"module.exports = require('./lib/chai');\n\
//@ sourceURL=chaijs-chai/index.js"
));
require.register("chaijs-chai/lib/chai.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
var used = []\n\
  , exports = module.exports = {};\n\
\n\
/*!\n\
 * Chai version\n\
 */\n\
\n\
exports.version = '1.8.1';\n\
\n\
/*!\n\
 * Assertion Error\n\
 */\n\
\n\
exports.AssertionError = require('assertion-error');\n\
\n\
/*!\n\
 * Utils for plugins (not exported)\n\
 */\n\
\n\
var util = require('./chai/utils');\n\
\n\
/**\n\
 * # .use(function)\n\
 *\n\
 * Provides a way to extend the internals of Chai\n\
 *\n\
 * @param {Function}\n\
 * @returns {this} for chaining\n\
 * @api public\n\
 */\n\
\n\
exports.use = function (fn) {\n\
  if (!~used.indexOf(fn)) {\n\
    fn(this, util);\n\
    used.push(fn);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/*!\n\
 * Primary `Assertion` prototype\n\
 */\n\
\n\
var assertion = require('./chai/assertion');\n\
exports.use(assertion);\n\
\n\
/*!\n\
 * Core Assertions\n\
 */\n\
\n\
var core = require('./chai/core/assertions');\n\
exports.use(core);\n\
\n\
/*!\n\
 * Expect interface\n\
 */\n\
\n\
var expect = require('./chai/interface/expect');\n\
exports.use(expect);\n\
\n\
/*!\n\
 * Should interface\n\
 */\n\
\n\
var should = require('./chai/interface/should');\n\
exports.use(should);\n\
\n\
/*!\n\
 * Assert interface\n\
 */\n\
\n\
var assert = require('./chai/interface/assert');\n\
exports.use(assert);\n\
//@ sourceURL=chaijs-chai/lib/chai.js"
));
require.register("chaijs-chai/lib/chai/assertion.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * http://chaijs.com\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
module.exports = function (_chai, util) {\n\
  /*!\n\
   * Module dependencies.\n\
   */\n\
\n\
  var AssertionError = _chai.AssertionError\n\
    , flag = util.flag;\n\
\n\
  /*!\n\
   * Module export.\n\
   */\n\
\n\
  _chai.Assertion = Assertion;\n\
\n\
  /*!\n\
   * Assertion Constructor\n\
   *\n\
   * Creates object for chaining.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  function Assertion (obj, msg, stack) {\n\
    flag(this, 'ssfi', stack || arguments.callee);\n\
    flag(this, 'object', obj);\n\
    flag(this, 'message', msg);\n\
  }\n\
\n\
  /*!\n\
    * ### Assertion.includeStack\n\
    *\n\
    * User configurable property, influences whether stack trace\n\
    * is included in Assertion error message. Default of false\n\
    * suppresses stack trace in the error message\n\
    *\n\
    *     Assertion.includeStack = true;  // enable stack on error\n\
    *\n\
    * @api public\n\
    */\n\
\n\
  Assertion.includeStack = false;\n\
\n\
  /*!\n\
   * ### Assertion.showDiff\n\
   *\n\
   * User configurable property, influences whether or not\n\
   * the `showDiff` flag should be included in the thrown\n\
   * AssertionErrors. `false` will always be `false`; `true`\n\
   * will be true when the assertion has requested a diff\n\
   * be shown.\n\
   *\n\
   * @api public\n\
   */\n\
\n\
  Assertion.showDiff = true;\n\
\n\
  Assertion.addProperty = function (name, fn) {\n\
    util.addProperty(this.prototype, name, fn);\n\
  };\n\
\n\
  Assertion.addMethod = function (name, fn) {\n\
    util.addMethod(this.prototype, name, fn);\n\
  };\n\
\n\
  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {\n\
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);\n\
  };\n\
\n\
  Assertion.overwriteProperty = function (name, fn) {\n\
    util.overwriteProperty(this.prototype, name, fn);\n\
  };\n\
\n\
  Assertion.overwriteMethod = function (name, fn) {\n\
    util.overwriteMethod(this.prototype, name, fn);\n\
  };\n\
\n\
  /*!\n\
   * ### .assert(expression, message, negateMessage, expected, actual)\n\
   *\n\
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.\n\
   *\n\
   * @name assert\n\
   * @param {Philosophical} expression to be tested\n\
   * @param {String} message to display if fails\n\
   * @param {String} negatedMessage to display if negated expression fails\n\
   * @param {Mixed} expected value (remember to check for negation)\n\
   * @param {Mixed} actual (optional) will default to `this.obj`\n\
   * @api private\n\
   */\n\
\n\
  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {\n\
    var ok = util.test(this, arguments);\n\
    if (true !== showDiff) showDiff = false;\n\
    if (true !== Assertion.showDiff) showDiff = false;\n\
\n\
    if (!ok) {\n\
      var msg = util.getMessage(this, arguments)\n\
        , actual = util.getActual(this, arguments);\n\
      throw new AssertionError(msg, {\n\
          actual: actual\n\
        , expected: expected\n\
        , showDiff: showDiff\n\
      }, (Assertion.includeStack) ? this.assert : flag(this, 'ssfi'));\n\
    }\n\
  };\n\
\n\
  /*!\n\
   * ### ._obj\n\
   *\n\
   * Quick reference to stored `actual` value for plugin developers.\n\
   *\n\
   * @api private\n\
   */\n\
\n\
  Object.defineProperty(Assertion.prototype, '_obj',\n\
    { get: function () {\n\
        return flag(this, 'object');\n\
      }\n\
    , set: function (val) {\n\
        flag(this, 'object', val);\n\
      }\n\
  });\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/assertion.js"
));
require.register("chaijs-chai/lib/chai/core/assertions.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * http://chaijs.com\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
module.exports = function (chai, _) {\n\
  var Assertion = chai.Assertion\n\
    , toString = Object.prototype.toString\n\
    , flag = _.flag;\n\
\n\
  /**\n\
   * ### Language Chains\n\
   *\n\
   * The following are provide as chainable getters to\n\
   * improve the readability of your assertions. They\n\
   * do not provide an testing capability unless they\n\
   * have been overwritten by a plugin.\n\
   *\n\
   * **Chains**\n\
   *\n\
   * - to\n\
   * - be\n\
   * - been\n\
   * - is\n\
   * - that\n\
   * - and\n\
   * - have\n\
   * - with\n\
   * - at\n\
   * - of\n\
   * - same\n\
   *\n\
   * @name language chains\n\
   * @api public\n\
   */\n\
\n\
  [ 'to', 'be', 'been'\n\
  , 'is', 'and', 'have'\n\
  , 'with', 'that', 'at'\n\
  , 'of', 'same' ].forEach(function (chain) {\n\
    Assertion.addProperty(chain, function () {\n\
      return this;\n\
    });\n\
  });\n\
\n\
  /**\n\
   * ### .not\n\
   *\n\
   * Negates any of assertions following in the chain.\n\
   *\n\
   *     expect(foo).to.not.equal('bar');\n\
   *     expect(goodFn).to.not.throw(Error);\n\
   *     expect({ foo: 'baz' }).to.have.property('foo')\n\
   *       .and.not.equal('bar');\n\
   *\n\
   * @name not\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('not', function () {\n\
    flag(this, 'negate', true);\n\
  });\n\
\n\
  /**\n\
   * ### .deep\n\
   *\n\
   * Sets the `deep` flag, later used by the `equal` and\n\
   * `property` assertions.\n\
   *\n\
   *     expect(foo).to.deep.equal({ bar: 'baz' });\n\
   *     expect({ foo: { bar: { baz: 'quux' } } })\n\
   *       .to.have.deep.property('foo.bar.baz', 'quux');\n\
   *\n\
   * @name deep\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('deep', function () {\n\
    flag(this, 'deep', true);\n\
  });\n\
\n\
  /**\n\
   * ### .a(type)\n\
   *\n\
   * The `a` and `an` assertions are aliases that can be\n\
   * used either as language chains or to assert a value's\n\
   * type.\n\
   *\n\
   *     // typeof\n\
   *     expect('test').to.be.a('string');\n\
   *     expect({ foo: 'bar' }).to.be.an('object');\n\
   *     expect(null).to.be.a('null');\n\
   *     expect(undefined).to.be.an('undefined');\n\
   *\n\
   *     // language chain\n\
   *     expect(foo).to.be.an.instanceof(Foo);\n\
   *\n\
   * @name a\n\
   * @alias an\n\
   * @param {String} type\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function an (type, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    type = type.toLowerCase();\n\
    var obj = flag(this, 'object')\n\
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';\n\
\n\
    this.assert(\n\
        type === _.type(obj)\n\
      , 'expected #{this} to be ' + article + type\n\
      , 'expected #{this} not to be ' + article + type\n\
    );\n\
  }\n\
\n\
  Assertion.addChainableMethod('an', an);\n\
  Assertion.addChainableMethod('a', an);\n\
\n\
  /**\n\
   * ### .include(value)\n\
   *\n\
   * The `include` and `contain` assertions can be used as either property\n\
   * based language chains or as methods to assert the inclusion of an object\n\
   * in an array or a substring in a string. When used as language chains,\n\
   * they toggle the `contain` flag for the `keys` assertion.\n\
   *\n\
   *     expect([1,2,3]).to.include(2);\n\
   *     expect('foobar').to.contain('foo');\n\
   *     expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');\n\
   *\n\
   * @name include\n\
   * @alias contain\n\
   * @param {Object|String|Number} obj\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function includeChainingBehavior () {\n\
    flag(this, 'contains', true);\n\
  }\n\
\n\
  function include (val, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object')\n\
    this.assert(\n\
        ~obj.indexOf(val)\n\
      , 'expected #{this} to include ' + _.inspect(val)\n\
      , 'expected #{this} to not include ' + _.inspect(val));\n\
  }\n\
\n\
  Assertion.addChainableMethod('include', include, includeChainingBehavior);\n\
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);\n\
\n\
  /**\n\
   * ### .ok\n\
   *\n\
   * Asserts that the target is truthy.\n\
   *\n\
   *     expect('everthing').to.be.ok;\n\
   *     expect(1).to.be.ok;\n\
   *     expect(false).to.not.be.ok;\n\
   *     expect(undefined).to.not.be.ok;\n\
   *     expect(null).to.not.be.ok;\n\
   *\n\
   * @name ok\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('ok', function () {\n\
    this.assert(\n\
        flag(this, 'object')\n\
      , 'expected #{this} to be truthy'\n\
      , 'expected #{this} to be falsy');\n\
  });\n\
\n\
  /**\n\
   * ### .true\n\
   *\n\
   * Asserts that the target is `true`.\n\
   *\n\
   *     expect(true).to.be.true;\n\
   *     expect(1).to.not.be.true;\n\
   *\n\
   * @name true\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('true', function () {\n\
    this.assert(\n\
        true === flag(this, 'object')\n\
      , 'expected #{this} to be true'\n\
      , 'expected #{this} to be false'\n\
      , this.negate ? false : true\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .false\n\
   *\n\
   * Asserts that the target is `false`.\n\
   *\n\
   *     expect(false).to.be.false;\n\
   *     expect(0).to.not.be.false;\n\
   *\n\
   * @name false\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('false', function () {\n\
    this.assert(\n\
        false === flag(this, 'object')\n\
      , 'expected #{this} to be false'\n\
      , 'expected #{this} to be true'\n\
      , this.negate ? true : false\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .null\n\
   *\n\
   * Asserts that the target is `null`.\n\
   *\n\
   *     expect(null).to.be.null;\n\
   *     expect(undefined).not.to.be.null;\n\
   *\n\
   * @name null\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('null', function () {\n\
    this.assert(\n\
        null === flag(this, 'object')\n\
      , 'expected #{this} to be null'\n\
      , 'expected #{this} not to be null'\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .undefined\n\
   *\n\
   * Asserts that the target is `undefined`.\n\
   *\n\
   *     expect(undefined).to.be.undefined;\n\
   *     expect(null).to.not.be.undefined;\n\
   *\n\
   * @name undefined\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('undefined', function () {\n\
    this.assert(\n\
        undefined === flag(this, 'object')\n\
      , 'expected #{this} to be undefined'\n\
      , 'expected #{this} not to be undefined'\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .exist\n\
   *\n\
   * Asserts that the target is neither `null` nor `undefined`.\n\
   *\n\
   *     var foo = 'hi'\n\
   *       , bar = null\n\
   *       , baz;\n\
   *\n\
   *     expect(foo).to.exist;\n\
   *     expect(bar).to.not.exist;\n\
   *     expect(baz).to.not.exist;\n\
   *\n\
   * @name exist\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('exist', function () {\n\
    this.assert(\n\
        null != flag(this, 'object')\n\
      , 'expected #{this} to exist'\n\
      , 'expected #{this} to not exist'\n\
    );\n\
  });\n\
\n\
\n\
  /**\n\
   * ### .empty\n\
   *\n\
   * Asserts that the target's length is `0`. For arrays, it checks\n\
   * the `length` property. For objects, it gets the count of\n\
   * enumerable keys.\n\
   *\n\
   *     expect([]).to.be.empty;\n\
   *     expect('').to.be.empty;\n\
   *     expect({}).to.be.empty;\n\
   *\n\
   * @name empty\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('empty', function () {\n\
    var obj = flag(this, 'object')\n\
      , expected = obj;\n\
\n\
    if (Array.isArray(obj) || 'string' === typeof object) {\n\
      expected = obj.length;\n\
    } else if (typeof obj === 'object') {\n\
      expected = Object.keys(obj).length;\n\
    }\n\
\n\
    this.assert(\n\
        !expected\n\
      , 'expected #{this} to be empty'\n\
      , 'expected #{this} not to be empty'\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .arguments\n\
   *\n\
   * Asserts that the target is an arguments object.\n\
   *\n\
   *     function test () {\n\
   *       expect(arguments).to.be.arguments;\n\
   *     }\n\
   *\n\
   * @name arguments\n\
   * @alias Arguments\n\
   * @api public\n\
   */\n\
\n\
  function checkArguments () {\n\
    var obj = flag(this, 'object')\n\
      , type = Object.prototype.toString.call(obj);\n\
    this.assert(\n\
        '[object Arguments]' === type\n\
      , 'expected #{this} to be arguments but got ' + type\n\
      , 'expected #{this} to not be arguments'\n\
    );\n\
  }\n\
\n\
  Assertion.addProperty('arguments', checkArguments);\n\
  Assertion.addProperty('Arguments', checkArguments);\n\
\n\
  /**\n\
   * ### .equal(value)\n\
   *\n\
   * Asserts that the target is strictly equal (`===`) to `value`.\n\
   * Alternately, if the `deep` flag is set, asserts that\n\
   * the target is deeply equal to `value`.\n\
   *\n\
   *     expect('hello').to.equal('hello');\n\
   *     expect(42).to.equal(42);\n\
   *     expect(1).to.not.equal(true);\n\
   *     expect({ foo: 'bar' }).to.not.equal({ foo: 'bar' });\n\
   *     expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });\n\
   *\n\
   * @name equal\n\
   * @alias equals\n\
   * @alias eq\n\
   * @alias deep.equal\n\
   * @param {Mixed} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertEqual (val, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    if (flag(this, 'deep')) {\n\
      return this.eql(val);\n\
    } else {\n\
      this.assert(\n\
          val === obj\n\
        , 'expected #{this} to equal #{exp}'\n\
        , 'expected #{this} to not equal #{exp}'\n\
        , val\n\
        , this._obj\n\
        , true\n\
      );\n\
    }\n\
  }\n\
\n\
  Assertion.addMethod('equal', assertEqual);\n\
  Assertion.addMethod('equals', assertEqual);\n\
  Assertion.addMethod('eq', assertEqual);\n\
\n\
  /**\n\
   * ### .eql(value)\n\
   *\n\
   * Asserts that the target is deeply equal to `value`.\n\
   *\n\
   *     expect({ foo: 'bar' }).to.eql({ foo: 'bar' });\n\
   *     expect([ 1, 2, 3 ]).to.eql([ 1, 2, 3 ]);\n\
   *\n\
   * @name eql\n\
   * @alias eqls\n\
   * @param {Mixed} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertEql(obj, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    this.assert(\n\
        _.eql(obj, flag(this, 'object'))\n\
      , 'expected #{this} to deeply equal #{exp}'\n\
      , 'expected #{this} to not deeply equal #{exp}'\n\
      , obj\n\
      , this._obj\n\
      , true\n\
    );\n\
  }\n\
\n\
  Assertion.addMethod('eql', assertEql);\n\
  Assertion.addMethod('eqls', assertEql);\n\
\n\
  /**\n\
   * ### .above(value)\n\
   *\n\
   * Asserts that the target is greater than `value`.\n\
   *\n\
   *     expect(10).to.be.above(5);\n\
   *\n\
   * Can also be used in conjunction with `length` to\n\
   * assert a minimum length. The benefit being a\n\
   * more informative error message than if the length\n\
   * was supplied directly.\n\
   *\n\
   *     expect('foo').to.have.length.above(2);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);\n\
   *\n\
   * @name above\n\
   * @alias gt\n\
   * @alias greaterThan\n\
   * @param {Number} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertAbove (n, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    if (flag(this, 'doLength')) {\n\
      new Assertion(obj, msg).to.have.property('length');\n\
      var len = obj.length;\n\
      this.assert(\n\
          len > n\n\
        , 'expected #{this} to have a length above #{exp} but got #{act}'\n\
        , 'expected #{this} to not have a length above #{exp}'\n\
        , n\n\
        , len\n\
      );\n\
    } else {\n\
      this.assert(\n\
          obj > n\n\
        , 'expected #{this} to be above ' + n\n\
        , 'expected #{this} to be at most ' + n\n\
      );\n\
    }\n\
  }\n\
\n\
  Assertion.addMethod('above', assertAbove);\n\
  Assertion.addMethod('gt', assertAbove);\n\
  Assertion.addMethod('greaterThan', assertAbove);\n\
\n\
  /**\n\
   * ### .least(value)\n\
   *\n\
   * Asserts that the target is greater than or equal to `value`.\n\
   *\n\
   *     expect(10).to.be.at.least(10);\n\
   *\n\
   * Can also be used in conjunction with `length` to\n\
   * assert a minimum length. The benefit being a\n\
   * more informative error message than if the length\n\
   * was supplied directly.\n\
   *\n\
   *     expect('foo').to.have.length.of.at.least(2);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.least(3);\n\
   *\n\
   * @name least\n\
   * @alias gte\n\
   * @param {Number} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertLeast (n, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    if (flag(this, 'doLength')) {\n\
      new Assertion(obj, msg).to.have.property('length');\n\
      var len = obj.length;\n\
      this.assert(\n\
          len >= n\n\
        , 'expected #{this} to have a length at least #{exp} but got #{act}'\n\
        , 'expected #{this} to have a length below #{exp}'\n\
        , n\n\
        , len\n\
      );\n\
    } else {\n\
      this.assert(\n\
          obj >= n\n\
        , 'expected #{this} to be at least ' + n\n\
        , 'expected #{this} to be below ' + n\n\
      );\n\
    }\n\
  }\n\
\n\
  Assertion.addMethod('least', assertLeast);\n\
  Assertion.addMethod('gte', assertLeast);\n\
\n\
  /**\n\
   * ### .below(value)\n\
   *\n\
   * Asserts that the target is less than `value`.\n\
   *\n\
   *     expect(5).to.be.below(10);\n\
   *\n\
   * Can also be used in conjunction with `length` to\n\
   * assert a maximum length. The benefit being a\n\
   * more informative error message than if the length\n\
   * was supplied directly.\n\
   *\n\
   *     expect('foo').to.have.length.below(4);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);\n\
   *\n\
   * @name below\n\
   * @alias lt\n\
   * @alias lessThan\n\
   * @param {Number} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertBelow (n, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    if (flag(this, 'doLength')) {\n\
      new Assertion(obj, msg).to.have.property('length');\n\
      var len = obj.length;\n\
      this.assert(\n\
          len < n\n\
        , 'expected #{this} to have a length below #{exp} but got #{act}'\n\
        , 'expected #{this} to not have a length below #{exp}'\n\
        , n\n\
        , len\n\
      );\n\
    } else {\n\
      this.assert(\n\
          obj < n\n\
        , 'expected #{this} to be below ' + n\n\
        , 'expected #{this} to be at least ' + n\n\
      );\n\
    }\n\
  }\n\
\n\
  Assertion.addMethod('below', assertBelow);\n\
  Assertion.addMethod('lt', assertBelow);\n\
  Assertion.addMethod('lessThan', assertBelow);\n\
\n\
  /**\n\
   * ### .most(value)\n\
   *\n\
   * Asserts that the target is less than or equal to `value`.\n\
   *\n\
   *     expect(5).to.be.at.most(5);\n\
   *\n\
   * Can also be used in conjunction with `length` to\n\
   * assert a maximum length. The benefit being a\n\
   * more informative error message than if the length\n\
   * was supplied directly.\n\
   *\n\
   *     expect('foo').to.have.length.of.at.most(4);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.of.at.most(3);\n\
   *\n\
   * @name most\n\
   * @alias lte\n\
   * @param {Number} value\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertMost (n, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    if (flag(this, 'doLength')) {\n\
      new Assertion(obj, msg).to.have.property('length');\n\
      var len = obj.length;\n\
      this.assert(\n\
          len <= n\n\
        , 'expected #{this} to have a length at most #{exp} but got #{act}'\n\
        , 'expected #{this} to have a length above #{exp}'\n\
        , n\n\
        , len\n\
      );\n\
    } else {\n\
      this.assert(\n\
          obj <= n\n\
        , 'expected #{this} to be at most ' + n\n\
        , 'expected #{this} to be above ' + n\n\
      );\n\
    }\n\
  }\n\
\n\
  Assertion.addMethod('most', assertMost);\n\
  Assertion.addMethod('lte', assertMost);\n\
\n\
  /**\n\
   * ### .within(start, finish)\n\
   *\n\
   * Asserts that the target is within a range.\n\
   *\n\
   *     expect(7).to.be.within(5,10);\n\
   *\n\
   * Can also be used in conjunction with `length` to\n\
   * assert a length range. The benefit being a\n\
   * more informative error message than if the length\n\
   * was supplied directly.\n\
   *\n\
   *     expect('foo').to.have.length.within(2,4);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);\n\
   *\n\
   * @name within\n\
   * @param {Number} start lowerbound inclusive\n\
   * @param {Number} finish upperbound inclusive\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('within', function (start, finish, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object')\n\
      , range = start + '..' + finish;\n\
    if (flag(this, 'doLength')) {\n\
      new Assertion(obj, msg).to.have.property('length');\n\
      var len = obj.length;\n\
      this.assert(\n\
          len >= start && len <= finish\n\
        , 'expected #{this} to have a length within ' + range\n\
        , 'expected #{this} to not have a length within ' + range\n\
      );\n\
    } else {\n\
      this.assert(\n\
          obj >= start && obj <= finish\n\
        , 'expected #{this} to be within ' + range\n\
        , 'expected #{this} to not be within ' + range\n\
      );\n\
    }\n\
  });\n\
\n\
  /**\n\
   * ### .instanceof(constructor)\n\
   *\n\
   * Asserts that the target is an instance of `constructor`.\n\
   *\n\
   *     var Tea = function (name) { this.name = name; }\n\
   *       , Chai = new Tea('chai');\n\
   *\n\
   *     expect(Chai).to.be.an.instanceof(Tea);\n\
   *     expect([ 1, 2, 3 ]).to.be.instanceof(Array);\n\
   *\n\
   * @name instanceof\n\
   * @param {Constructor} constructor\n\
   * @param {String} message _optional_\n\
   * @alias instanceOf\n\
   * @api public\n\
   */\n\
\n\
  function assertInstanceOf (constructor, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var name = _.getName(constructor);\n\
    this.assert(\n\
        flag(this, 'object') instanceof constructor\n\
      , 'expected #{this} to be an instance of ' + name\n\
      , 'expected #{this} to not be an instance of ' + name\n\
    );\n\
  };\n\
\n\
  Assertion.addMethod('instanceof', assertInstanceOf);\n\
  Assertion.addMethod('instanceOf', assertInstanceOf);\n\
\n\
  /**\n\
   * ### .property(name, [value])\n\
   *\n\
   * Asserts that the target has a property `name`, optionally asserting that\n\
   * the value of that property is strictly equal to  `value`.\n\
   * If the `deep` flag is set, you can use dot- and bracket-notation for deep\n\
   * references into objects and arrays.\n\
   *\n\
   *     // simple referencing\n\
   *     var obj = { foo: 'bar' };\n\
   *     expect(obj).to.have.property('foo');\n\
   *     expect(obj).to.have.property('foo', 'bar');\n\
   *\n\
   *     // deep referencing\n\
   *     var deepObj = {\n\
   *         green: { tea: 'matcha' }\n\
   *       , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]\n\
   *     };\n\
\n\
   *     expect(deepObj).to.have.deep.property('green.tea', 'matcha');\n\
   *     expect(deepObj).to.have.deep.property('teas[1]', 'matcha');\n\
   *     expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');\n\
   *\n\
   * You can also use an array as the starting point of a `deep.property`\n\
   * assertion, or traverse nested arrays.\n\
   *\n\
   *     var arr = [\n\
   *         [ 'chai', 'matcha', 'konacha' ]\n\
   *       , [ { tea: 'chai' }\n\
   *         , { tea: 'matcha' }\n\
   *         , { tea: 'konacha' } ]\n\
   *     ];\n\
   *\n\
   *     expect(arr).to.have.deep.property('[0][1]', 'matcha');\n\
   *     expect(arr).to.have.deep.property('[1][2].tea', 'konacha');\n\
   *\n\
   * Furthermore, `property` changes the subject of the assertion\n\
   * to be the value of that property from the original object. This\n\
   * permits for further chainable assertions on that property.\n\
   *\n\
   *     expect(obj).to.have.property('foo')\n\
   *       .that.is.a('string');\n\
   *     expect(deepObj).to.have.property('green')\n\
   *       .that.is.an('object')\n\
   *       .that.deep.equals({ tea: 'matcha' });\n\
   *     expect(deepObj).to.have.property('teas')\n\
   *       .that.is.an('array')\n\
   *       .with.deep.property('[2]')\n\
   *         .that.deep.equals({ tea: 'konacha' });\n\
   *\n\
   * @name property\n\
   * @alias deep.property\n\
   * @param {String} name\n\
   * @param {Mixed} value (optional)\n\
   * @param {String} message _optional_\n\
   * @returns value of property for chaining\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('property', function (name, val, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
\n\
    var descriptor = flag(this, 'deep') ? 'deep property ' : 'property '\n\
      , negate = flag(this, 'negate')\n\
      , obj = flag(this, 'object')\n\
      , value = flag(this, 'deep')\n\
        ? _.getPathValue(name, obj)\n\
        : obj[name];\n\
\n\
    if (negate && undefined !== val) {\n\
      if (undefined === value) {\n\
        msg = (msg != null) ? msg + ': ' : '';\n\
        throw new Error(msg + _.inspect(obj) + ' has no ' + descriptor + _.inspect(name));\n\
      }\n\
    } else {\n\
      this.assert(\n\
          undefined !== value\n\
        , 'expected #{this} to have a ' + descriptor + _.inspect(name)\n\
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));\n\
    }\n\
\n\
    if (undefined !== val) {\n\
      this.assert(\n\
          val === value\n\
        , 'expected #{this} to have a ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'\n\
        , 'expected #{this} to not have a ' + descriptor + _.inspect(name) + ' of #{act}'\n\
        , val\n\
        , value\n\
      );\n\
    }\n\
\n\
    flag(this, 'object', value);\n\
  });\n\
\n\
\n\
  /**\n\
   * ### .ownProperty(name)\n\
   *\n\
   * Asserts that the target has an own property `name`.\n\
   *\n\
   *     expect('test').to.have.ownProperty('length');\n\
   *\n\
   * @name ownProperty\n\
   * @alias haveOwnProperty\n\
   * @param {String} name\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertOwnProperty (name, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    this.assert(\n\
        obj.hasOwnProperty(name)\n\
      , 'expected #{this} to have own property ' + _.inspect(name)\n\
      , 'expected #{this} to not have own property ' + _.inspect(name)\n\
    );\n\
  }\n\
\n\
  Assertion.addMethod('ownProperty', assertOwnProperty);\n\
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);\n\
\n\
  /**\n\
   * ### .length(value)\n\
   *\n\
   * Asserts that the target's `length` property has\n\
   * the expected value.\n\
   *\n\
   *     expect([ 1, 2, 3]).to.have.length(3);\n\
   *     expect('foobar').to.have.length(6);\n\
   *\n\
   * Can also be used as a chain precursor to a value\n\
   * comparison for the length property.\n\
   *\n\
   *     expect('foo').to.have.length.above(2);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.above(2);\n\
   *     expect('foo').to.have.length.below(4);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.below(4);\n\
   *     expect('foo').to.have.length.within(2,4);\n\
   *     expect([ 1, 2, 3 ]).to.have.length.within(2,4);\n\
   *\n\
   * @name length\n\
   * @alias lengthOf\n\
   * @param {Number} length\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  function assertLengthChain () {\n\
    flag(this, 'doLength', true);\n\
  }\n\
\n\
  function assertLength (n, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    new Assertion(obj, msg).to.have.property('length');\n\
    var len = obj.length;\n\
\n\
    this.assert(\n\
        len == n\n\
      , 'expected #{this} to have a length of #{exp} but got #{act}'\n\
      , 'expected #{this} to not have a length of #{act}'\n\
      , n\n\
      , len\n\
    );\n\
  }\n\
\n\
  Assertion.addChainableMethod('length', assertLength, assertLengthChain);\n\
  Assertion.addMethod('lengthOf', assertLength, assertLengthChain);\n\
\n\
  /**\n\
   * ### .match(regexp)\n\
   *\n\
   * Asserts that the target matches a regular expression.\n\
   *\n\
   *     expect('foobar').to.match(/^foo/);\n\
   *\n\
   * @name match\n\
   * @param {RegExp} RegularExpression\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('match', function (re, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    this.assert(\n\
        re.exec(obj)\n\
      , 'expected #{this} to match ' + re\n\
      , 'expected #{this} not to match ' + re\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .string(string)\n\
   *\n\
   * Asserts that the string target contains another string.\n\
   *\n\
   *     expect('foobar').to.have.string('bar');\n\
   *\n\
   * @name string\n\
   * @param {String} string\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('string', function (str, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    new Assertion(obj, msg).is.a('string');\n\
\n\
    this.assert(\n\
        ~obj.indexOf(str)\n\
      , 'expected #{this} to contain ' + _.inspect(str)\n\
      , 'expected #{this} to not contain ' + _.inspect(str)\n\
    );\n\
  });\n\
\n\
\n\
  /**\n\
   * ### .keys(key1, [key2], [...])\n\
   *\n\
   * Asserts that the target has exactly the given keys, or\n\
   * asserts the inclusion of some keys when using the\n\
   * `include` or `contain` modifiers.\n\
   *\n\
   *     expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);\n\
   *     expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');\n\
   *\n\
   * @name keys\n\
   * @alias key\n\
   * @param {String...|Array} keys\n\
   * @api public\n\
   */\n\
\n\
  function assertKeys (keys) {\n\
    var obj = flag(this, 'object')\n\
      , str\n\
      , ok = true;\n\
\n\
    keys = keys instanceof Array\n\
      ? keys\n\
      : Array.prototype.slice.call(arguments);\n\
\n\
    if (!keys.length) throw new Error('keys required');\n\
\n\
    var actual = Object.keys(obj)\n\
      , len = keys.length;\n\
\n\
    // Inclusion\n\
    ok = keys.every(function(key){\n\
      return ~actual.indexOf(key);\n\
    });\n\
\n\
    // Strict\n\
    if (!flag(this, 'negate') && !flag(this, 'contains')) {\n\
      ok = ok && keys.length == actual.length;\n\
    }\n\
\n\
    // Key string\n\
    if (len > 1) {\n\
      keys = keys.map(function(key){\n\
        return _.inspect(key);\n\
      });\n\
      var last = keys.pop();\n\
      str = keys.join(', ') + ', and ' + last;\n\
    } else {\n\
      str = _.inspect(keys[0]);\n\
    }\n\
\n\
    // Form\n\
    str = (len > 1 ? 'keys ' : 'key ') + str;\n\
\n\
    // Have / include\n\
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;\n\
\n\
    // Assertion\n\
    this.assert(\n\
        ok\n\
      , 'expected #{this} to ' + str\n\
      , 'expected #{this} to not ' + str\n\
    );\n\
  }\n\
\n\
  Assertion.addMethod('keys', assertKeys);\n\
  Assertion.addMethod('key', assertKeys);\n\
\n\
  /**\n\
   * ### .throw(constructor)\n\
   *\n\
   * Asserts that the function target will throw a specific error, or specific type of error\n\
   * (as determined using `instanceof`), optionally with a RegExp or string inclusion test\n\
   * for the error's message.\n\
   *\n\
   *     var err = new ReferenceError('This is a bad function.');\n\
   *     var fn = function () { throw err; }\n\
   *     expect(fn).to.throw(ReferenceError);\n\
   *     expect(fn).to.throw(Error);\n\
   *     expect(fn).to.throw(/bad function/);\n\
   *     expect(fn).to.not.throw('good function');\n\
   *     expect(fn).to.throw(ReferenceError, /bad function/);\n\
   *     expect(fn).to.throw(err);\n\
   *     expect(fn).to.not.throw(new RangeError('Out of range.'));\n\
   *\n\
   * Please note that when a throw expectation is negated, it will check each\n\
   * parameter independently, starting with error constructor type. The appropriate way\n\
   * to check for the existence of a type of error but for a message that does not match\n\
   * is to use `and`.\n\
   *\n\
   *     expect(fn).to.throw(ReferenceError)\n\
   *        .and.not.throw(/good function/);\n\
   *\n\
   * @name throw\n\
   * @alias throws\n\
   * @alias Throw\n\
   * @param {ErrorConstructor} constructor\n\
   * @param {String|RegExp} expected error message\n\
   * @param {String} message _optional_\n\
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types\n\
   * @api public\n\
   */\n\
\n\
  function assertThrows (constructor, errMsg, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    new Assertion(obj, msg).is.a('function');\n\
\n\
    var thrown = false\n\
      , desiredError = null\n\
      , name = null\n\
      , thrownError = null;\n\
\n\
    if (arguments.length === 0) {\n\
      errMsg = null;\n\
      constructor = null;\n\
    } else if (constructor && (constructor instanceof RegExp || 'string' === typeof constructor)) {\n\
      errMsg = constructor;\n\
      constructor = null;\n\
    } else if (constructor && constructor instanceof Error) {\n\
      desiredError = constructor;\n\
      constructor = null;\n\
      errMsg = null;\n\
    } else if (typeof constructor === 'function') {\n\
      name = (new constructor()).name;\n\
    } else {\n\
      constructor = null;\n\
    }\n\
\n\
    try {\n\
      obj();\n\
    } catch (err) {\n\
      // first, check desired error\n\
      if (desiredError) {\n\
        this.assert(\n\
            err === desiredError\n\
          , 'expected #{this} to throw #{exp} but #{act} was thrown'\n\
          , 'expected #{this} to not throw #{exp}'\n\
          , (desiredError instanceof Error ? desiredError.toString() : desiredError)\n\
          , (err instanceof Error ? err.toString() : err)\n\
        );\n\
\n\
        return this;\n\
      }\n\
      // next, check constructor\n\
      if (constructor) {\n\
        this.assert(\n\
            err instanceof constructor\n\
          , 'expected #{this} to throw #{exp} but #{act} was thrown'\n\
          , 'expected #{this} to not throw #{exp} but #{act} was thrown'\n\
          , name\n\
          , (err instanceof Error ? err.toString() : err)\n\
        );\n\
\n\
        if (!errMsg) return this;\n\
      }\n\
      // next, check message\n\
      var message = 'object' === _.type(err) && \"message\" in err\n\
        ? err.message\n\
        : '' + err;\n\
\n\
      if ((message != null) && errMsg && errMsg instanceof RegExp) {\n\
        this.assert(\n\
            errMsg.exec(message)\n\
          , 'expected #{this} to throw error matching #{exp} but got #{act}'\n\
          , 'expected #{this} to throw error not matching #{exp}'\n\
          , errMsg\n\
          , message\n\
        );\n\
\n\
        return this;\n\
      } else if ((message != null) && errMsg && 'string' === typeof errMsg) {\n\
        this.assert(\n\
            ~message.indexOf(errMsg)\n\
          , 'expected #{this} to throw error including #{exp} but got #{act}'\n\
          , 'expected #{this} to throw error not including #{act}'\n\
          , errMsg\n\
          , message\n\
        );\n\
\n\
        return this;\n\
      } else {\n\
        thrown = true;\n\
        thrownError = err;\n\
      }\n\
    }\n\
\n\
    var actuallyGot = ''\n\
      , expectedThrown = name !== null\n\
        ? name\n\
        : desiredError\n\
          ? '#{exp}' //_.inspect(desiredError)\n\
          : 'an error';\n\
\n\
    if (thrown) {\n\
      actuallyGot = ' but #{act} was thrown'\n\
    }\n\
\n\
    this.assert(\n\
        thrown === true\n\
      , 'expected #{this} to throw ' + expectedThrown + actuallyGot\n\
      , 'expected #{this} to not throw ' + expectedThrown + actuallyGot\n\
      , (desiredError instanceof Error ? desiredError.toString() : desiredError)\n\
      , (thrownError instanceof Error ? thrownError.toString() : thrownError)\n\
    );\n\
  };\n\
\n\
  Assertion.addMethod('throw', assertThrows);\n\
  Assertion.addMethod('throws', assertThrows);\n\
  Assertion.addMethod('Throw', assertThrows);\n\
\n\
  /**\n\
   * ### .respondTo(method)\n\
   *\n\
   * Asserts that the object or class target will respond to a method.\n\
   *\n\
   *     Klass.prototype.bar = function(){};\n\
   *     expect(Klass).to.respondTo('bar');\n\
   *     expect(obj).to.respondTo('bar');\n\
   *\n\
   * To check if a constructor will respond to a static function,\n\
   * set the `itself` flag.\n\
   *\n\
   *     Klass.baz = function(){};\n\
   *     expect(Klass).itself.to.respondTo('baz');\n\
   *\n\
   * @name respondTo\n\
   * @param {String} method\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('respondTo', function (method, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object')\n\
      , itself = flag(this, 'itself')\n\
      , context = ('function' === _.type(obj) && !itself)\n\
        ? obj.prototype[method]\n\
        : obj[method];\n\
\n\
    this.assert(\n\
        'function' === typeof context\n\
      , 'expected #{this} to respond to ' + _.inspect(method)\n\
      , 'expected #{this} to not respond to ' + _.inspect(method)\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .itself\n\
   *\n\
   * Sets the `itself` flag, later used by the `respondTo` assertion.\n\
   *\n\
   *     function Foo() {}\n\
   *     Foo.bar = function() {}\n\
   *     Foo.prototype.baz = function() {}\n\
   *\n\
   *     expect(Foo).itself.to.respondTo('bar');\n\
   *     expect(Foo).itself.not.to.respondTo('baz');\n\
   *\n\
   * @name itself\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addProperty('itself', function () {\n\
    flag(this, 'itself', true);\n\
  });\n\
\n\
  /**\n\
   * ### .satisfy(method)\n\
   *\n\
   * Asserts that the target passes a given truth test.\n\
   *\n\
   *     expect(1).to.satisfy(function(num) { return num > 0; });\n\
   *\n\
   * @name satisfy\n\
   * @param {Function} matcher\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('satisfy', function (matcher, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    this.assert(\n\
        matcher(obj)\n\
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)\n\
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)\n\
      , this.negate ? false : true\n\
      , matcher(obj)\n\
    );\n\
  });\n\
\n\
  /**\n\
   * ### .closeTo(expected, delta)\n\
   *\n\
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.\n\
   *\n\
   *     expect(1.5).to.be.closeTo(1, 0.5);\n\
   *\n\
   * @name closeTo\n\
   * @param {Number} expected\n\
   * @param {Number} delta\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('closeTo', function (expected, delta, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
    this.assert(\n\
        Math.abs(obj - expected) <= delta\n\
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta\n\
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta\n\
    );\n\
  });\n\
\n\
  function isSubsetOf(subset, superset) {\n\
    return subset.every(function(elem) {\n\
      return superset.indexOf(elem) !== -1;\n\
    })\n\
  }\n\
\n\
  /**\n\
   * ### .members(set)\n\
   *\n\
   * Asserts that the target is a superset of `set`,\n\
   * or that the target and `set` have the same members.\n\
   *\n\
   *     expect([1, 2, 3]).to.include.members([3, 2]);\n\
   *     expect([1, 2, 3]).to.not.include.members([3, 2, 8]);\n\
   *\n\
   *     expect([4, 2]).to.have.members([2, 4]);\n\
   *     expect([5, 2]).to.not.have.members([5, 2, 1]);\n\
   *\n\
   * @name members\n\
   * @param {Array} set\n\
   * @param {String} message _optional_\n\
   * @api public\n\
   */\n\
\n\
  Assertion.addMethod('members', function (subset, msg) {\n\
    if (msg) flag(this, 'message', msg);\n\
    var obj = flag(this, 'object');\n\
\n\
    new Assertion(obj).to.be.an('array');\n\
    new Assertion(subset).to.be.an('array');\n\
\n\
    if (flag(this, 'contains')) {\n\
      return this.assert(\n\
          isSubsetOf(subset, obj)\n\
        , 'expected #{this} to be a superset of #{act}'\n\
        , 'expected #{this} to not be a superset of #{act}'\n\
        , obj\n\
        , subset\n\
      );\n\
    }\n\
\n\
    this.assert(\n\
        isSubsetOf(obj, subset) && isSubsetOf(subset, obj)\n\
        , 'expected #{this} to have the same members as #{act}'\n\
        , 'expected #{this} to not have the same members as #{act}'\n\
        , obj\n\
        , subset\n\
    );\n\
  });\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/core/assertions.js"
));
require.register("chaijs-chai/lib/chai/interface/assert.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
\n\
module.exports = function (chai, util) {\n\
\n\
  /*!\n\
   * Chai dependencies.\n\
   */\n\
\n\
  var Assertion = chai.Assertion\n\
    , flag = util.flag;\n\
\n\
  /*!\n\
   * Module export.\n\
   */\n\
\n\
  /**\n\
   * ### assert(expression, message)\n\
   *\n\
   * Write your own test expressions.\n\
   *\n\
   *     assert('foo' !== 'bar', 'foo is not bar');\n\
   *     assert(Array.isArray([]), 'empty arrays are arrays');\n\
   *\n\
   * @param {Mixed} expression to test for truthiness\n\
   * @param {String} message to display on error\n\
   * @name assert\n\
   * @api public\n\
   */\n\
\n\
  var assert = chai.assert = function (express, errmsg) {\n\
    var test = new Assertion(null);\n\
    test.assert(\n\
        express\n\
      , errmsg\n\
      , '[ negation message unavailable ]'\n\
    );\n\
  };\n\
\n\
  /**\n\
   * ### .fail(actual, expected, [message], [operator])\n\
   *\n\
   * Throw a failure. Node.js `assert` module-compatible.\n\
   *\n\
   * @name fail\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @param {String} operator\n\
   * @api public\n\
   */\n\
\n\
  assert.fail = function (actual, expected, message, operator) {\n\
    throw new chai.AssertionError({\n\
        actual: actual\n\
      , expected: expected\n\
      , message: message\n\
      , operator: operator\n\
      , stackStartFunction: assert.fail\n\
    });\n\
  };\n\
\n\
  /**\n\
   * ### .ok(object, [message])\n\
   *\n\
   * Asserts that `object` is truthy.\n\
   *\n\
   *     assert.ok('everything', 'everything is ok');\n\
   *     assert.ok(false, 'this will fail');\n\
   *\n\
   * @name ok\n\
   * @param {Mixed} object to test\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.ok = function (val, msg) {\n\
    new Assertion(val, msg).is.ok;\n\
  };\n\
\n\
  /**\n\
   * ### .notOk(object, [message])\n\
   *\n\
   * Asserts that `object` is falsy.\n\
   *\n\
   *     assert.notOk('everything', 'this will fail');\n\
   *     assert.notOk(false, 'this will pass');\n\
   *\n\
   * @name notOk\n\
   * @param {Mixed} object to test\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notOk = function (val, msg) {\n\
    new Assertion(val, msg).is.not.ok;\n\
  };\n\
\n\
  /**\n\
   * ### .equal(actual, expected, [message])\n\
   *\n\
   * Asserts non-strict equality (`==`) of `actual` and `expected`.\n\
   *\n\
   *     assert.equal(3, '3', '== coerces values to strings');\n\
   *\n\
   * @name equal\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.equal = function (act, exp, msg) {\n\
    var test = new Assertion(act, msg);\n\
\n\
    test.assert(\n\
        exp == flag(test, 'object')\n\
      , 'expected #{this} to equal #{exp}'\n\
      , 'expected #{this} to not equal #{act}'\n\
      , exp\n\
      , act\n\
    );\n\
  };\n\
\n\
  /**\n\
   * ### .notEqual(actual, expected, [message])\n\
   *\n\
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.\n\
   *\n\
   *     assert.notEqual(3, 4, 'these numbers are not equal');\n\
   *\n\
   * @name notEqual\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notEqual = function (act, exp, msg) {\n\
    var test = new Assertion(act, msg);\n\
\n\
    test.assert(\n\
        exp != flag(test, 'object')\n\
      , 'expected #{this} to not equal #{exp}'\n\
      , 'expected #{this} to equal #{act}'\n\
      , exp\n\
      , act\n\
    );\n\
  };\n\
\n\
  /**\n\
   * ### .strictEqual(actual, expected, [message])\n\
   *\n\
   * Asserts strict equality (`===`) of `actual` and `expected`.\n\
   *\n\
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');\n\
   *\n\
   * @name strictEqual\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.strictEqual = function (act, exp, msg) {\n\
    new Assertion(act, msg).to.equal(exp);\n\
  };\n\
\n\
  /**\n\
   * ### .notStrictEqual(actual, expected, [message])\n\
   *\n\
   * Asserts strict inequality (`!==`) of `actual` and `expected`.\n\
   *\n\
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');\n\
   *\n\
   * @name notStrictEqual\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notStrictEqual = function (act, exp, msg) {\n\
    new Assertion(act, msg).to.not.equal(exp);\n\
  };\n\
\n\
  /**\n\
   * ### .deepEqual(actual, expected, [message])\n\
   *\n\
   * Asserts that `actual` is deeply equal to `expected`.\n\
   *\n\
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });\n\
   *\n\
   * @name deepEqual\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.deepEqual = function (act, exp, msg) {\n\
    new Assertion(act, msg).to.eql(exp);\n\
  };\n\
\n\
  /**\n\
   * ### .notDeepEqual(actual, expected, [message])\n\
   *\n\
   * Assert that `actual` is not deeply equal to `expected`.\n\
   *\n\
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });\n\
   *\n\
   * @name notDeepEqual\n\
   * @param {Mixed} actual\n\
   * @param {Mixed} expected\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notDeepEqual = function (act, exp, msg) {\n\
    new Assertion(act, msg).to.not.eql(exp);\n\
  };\n\
\n\
  /**\n\
   * ### .isTrue(value, [message])\n\
   *\n\
   * Asserts that `value` is true.\n\
   *\n\
   *     var teaServed = true;\n\
   *     assert.isTrue(teaServed, 'the tea has been served');\n\
   *\n\
   * @name isTrue\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isTrue = function (val, msg) {\n\
    new Assertion(val, msg).is['true'];\n\
  };\n\
\n\
  /**\n\
   * ### .isFalse(value, [message])\n\
   *\n\
   * Asserts that `value` is false.\n\
   *\n\
   *     var teaServed = false;\n\
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');\n\
   *\n\
   * @name isFalse\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isFalse = function (val, msg) {\n\
    new Assertion(val, msg).is['false'];\n\
  };\n\
\n\
  /**\n\
   * ### .isNull(value, [message])\n\
   *\n\
   * Asserts that `value` is null.\n\
   *\n\
   *     assert.isNull(err, 'there was no error');\n\
   *\n\
   * @name isNull\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNull = function (val, msg) {\n\
    new Assertion(val, msg).to.equal(null);\n\
  };\n\
\n\
  /**\n\
   * ### .isNotNull(value, [message])\n\
   *\n\
   * Asserts that `value` is not null.\n\
   *\n\
   *     var tea = 'tasty chai';\n\
   *     assert.isNotNull(tea, 'great, time for tea!');\n\
   *\n\
   * @name isNotNull\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotNull = function (val, msg) {\n\
    new Assertion(val, msg).to.not.equal(null);\n\
  };\n\
\n\
  /**\n\
   * ### .isUndefined(value, [message])\n\
   *\n\
   * Asserts that `value` is `undefined`.\n\
   *\n\
   *     var tea;\n\
   *     assert.isUndefined(tea, 'no tea defined');\n\
   *\n\
   * @name isUndefined\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isUndefined = function (val, msg) {\n\
    new Assertion(val, msg).to.equal(undefined);\n\
  };\n\
\n\
  /**\n\
   * ### .isDefined(value, [message])\n\
   *\n\
   * Asserts that `value` is not `undefined`.\n\
   *\n\
   *     var tea = 'cup of chai';\n\
   *     assert.isDefined(tea, 'tea has been defined');\n\
   *\n\
   * @name isDefined\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isDefined = function (val, msg) {\n\
    new Assertion(val, msg).to.not.equal(undefined);\n\
  };\n\
\n\
  /**\n\
   * ### .isFunction(value, [message])\n\
   *\n\
   * Asserts that `value` is a function.\n\
   *\n\
   *     function serveTea() { return 'cup of tea'; };\n\
   *     assert.isFunction(serveTea, 'great, we can have tea now');\n\
   *\n\
   * @name isFunction\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isFunction = function (val, msg) {\n\
    new Assertion(val, msg).to.be.a('function');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotFunction(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ a function.\n\
   *\n\
   *     var serveTea = [ 'heat', 'pour', 'sip' ];\n\
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');\n\
   *\n\
   * @name isNotFunction\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotFunction = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.a('function');\n\
  };\n\
\n\
  /**\n\
   * ### .isObject(value, [message])\n\
   *\n\
   * Asserts that `value` is an object (as revealed by\n\
   * `Object.prototype.toString`).\n\
   *\n\
   *     var selection = { name: 'Chai', serve: 'with spices' };\n\
   *     assert.isObject(selection, 'tea selection is an object');\n\
   *\n\
   * @name isObject\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isObject = function (val, msg) {\n\
    new Assertion(val, msg).to.be.a('object');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotObject(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ an object.\n\
   *\n\
   *     var selection = 'chai'\n\
   *     assert.isObject(selection, 'tea selection is not an object');\n\
   *     assert.isObject(null, 'null is not an object');\n\
   *\n\
   * @name isNotObject\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotObject = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.a('object');\n\
  };\n\
\n\
  /**\n\
   * ### .isArray(value, [message])\n\
   *\n\
   * Asserts that `value` is an array.\n\
   *\n\
   *     var menu = [ 'green', 'chai', 'oolong' ];\n\
   *     assert.isArray(menu, 'what kind of tea do we want?');\n\
   *\n\
   * @name isArray\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isArray = function (val, msg) {\n\
    new Assertion(val, msg).to.be.an('array');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotArray(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ an array.\n\
   *\n\
   *     var menu = 'green|chai|oolong';\n\
   *     assert.isNotArray(menu, 'what kind of tea do we want?');\n\
   *\n\
   * @name isNotArray\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotArray = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.an('array');\n\
  };\n\
\n\
  /**\n\
   * ### .isString(value, [message])\n\
   *\n\
   * Asserts that `value` is a string.\n\
   *\n\
   *     var teaOrder = 'chai';\n\
   *     assert.isString(teaOrder, 'order placed');\n\
   *\n\
   * @name isString\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isString = function (val, msg) {\n\
    new Assertion(val, msg).to.be.a('string');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotString(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ a string.\n\
   *\n\
   *     var teaOrder = 4;\n\
   *     assert.isNotString(teaOrder, 'order placed');\n\
   *\n\
   * @name isNotString\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotString = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.a('string');\n\
  };\n\
\n\
  /**\n\
   * ### .isNumber(value, [message])\n\
   *\n\
   * Asserts that `value` is a number.\n\
   *\n\
   *     var cups = 2;\n\
   *     assert.isNumber(cups, 'how many cups');\n\
   *\n\
   * @name isNumber\n\
   * @param {Number} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNumber = function (val, msg) {\n\
    new Assertion(val, msg).to.be.a('number');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotNumber(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ a number.\n\
   *\n\
   *     var cups = '2 cups please';\n\
   *     assert.isNotNumber(cups, 'how many cups');\n\
   *\n\
   * @name isNotNumber\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotNumber = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.a('number');\n\
  };\n\
\n\
  /**\n\
   * ### .isBoolean(value, [message])\n\
   *\n\
   * Asserts that `value` is a boolean.\n\
   *\n\
   *     var teaReady = true\n\
   *       , teaServed = false;\n\
   *\n\
   *     assert.isBoolean(teaReady, 'is the tea ready');\n\
   *     assert.isBoolean(teaServed, 'has tea been served');\n\
   *\n\
   * @name isBoolean\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isBoolean = function (val, msg) {\n\
    new Assertion(val, msg).to.be.a('boolean');\n\
  };\n\
\n\
  /**\n\
   * ### .isNotBoolean(value, [message])\n\
   *\n\
   * Asserts that `value` is _not_ a boolean.\n\
   *\n\
   *     var teaReady = 'yep'\n\
   *       , teaServed = 'nope';\n\
   *\n\
   *     assert.isNotBoolean(teaReady, 'is the tea ready');\n\
   *     assert.isNotBoolean(teaServed, 'has tea been served');\n\
   *\n\
   * @name isNotBoolean\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.isNotBoolean = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.a('boolean');\n\
  };\n\
\n\
  /**\n\
   * ### .typeOf(value, name, [message])\n\
   *\n\
   * Asserts that `value`'s type is `name`, as determined by\n\
   * `Object.prototype.toString`.\n\
   *\n\
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');\n\
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');\n\
   *     assert.typeOf('tea', 'string', 'we have a string');\n\
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');\n\
   *     assert.typeOf(null, 'null', 'we have a null');\n\
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');\n\
   *\n\
   * @name typeOf\n\
   * @param {Mixed} value\n\
   * @param {String} name\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.typeOf = function (val, type, msg) {\n\
    new Assertion(val, msg).to.be.a(type);\n\
  };\n\
\n\
  /**\n\
   * ### .notTypeOf(value, name, [message])\n\
   *\n\
   * Asserts that `value`'s type is _not_ `name`, as determined by\n\
   * `Object.prototype.toString`.\n\
   *\n\
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');\n\
   *\n\
   * @name notTypeOf\n\
   * @param {Mixed} value\n\
   * @param {String} typeof name\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notTypeOf = function (val, type, msg) {\n\
    new Assertion(val, msg).to.not.be.a(type);\n\
  };\n\
\n\
  /**\n\
   * ### .instanceOf(object, constructor, [message])\n\
   *\n\
   * Asserts that `value` is an instance of `constructor`.\n\
   *\n\
   *     var Tea = function (name) { this.name = name; }\n\
   *       , chai = new Tea('chai');\n\
   *\n\
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');\n\
   *\n\
   * @name instanceOf\n\
   * @param {Object} object\n\
   * @param {Constructor} constructor\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.instanceOf = function (val, type, msg) {\n\
    new Assertion(val, msg).to.be.instanceOf(type);\n\
  };\n\
\n\
  /**\n\
   * ### .notInstanceOf(object, constructor, [message])\n\
   *\n\
   * Asserts `value` is not an instance of `constructor`.\n\
   *\n\
   *     var Tea = function (name) { this.name = name; }\n\
   *       , chai = new String('chai');\n\
   *\n\
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');\n\
   *\n\
   * @name notInstanceOf\n\
   * @param {Object} object\n\
   * @param {Constructor} constructor\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notInstanceOf = function (val, type, msg) {\n\
    new Assertion(val, msg).to.not.be.instanceOf(type);\n\
  };\n\
\n\
  /**\n\
   * ### .include(haystack, needle, [message])\n\
   *\n\
   * Asserts that `haystack` includes `needle`. Works\n\
   * for strings and arrays.\n\
   *\n\
   *     assert.include('foobar', 'bar', 'foobar contains string \"bar\"');\n\
   *     assert.include([ 1, 2, 3 ], 3, 'array contains value');\n\
   *\n\
   * @name include\n\
   * @param {Array|String} haystack\n\
   * @param {Mixed} needle\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.include = function (exp, inc, msg) {\n\
    var obj = new Assertion(exp, msg);\n\
\n\
    if (Array.isArray(exp)) {\n\
      obj.to.include(inc);\n\
    } else if ('string' === typeof exp) {\n\
      obj.to.contain.string(inc);\n\
    } else {\n\
      throw new chai.AssertionError(\n\
          'expected an array or string'\n\
        , null\n\
        , assert.include\n\
      );\n\
    }\n\
  };\n\
\n\
  /**\n\
   * ### .notInclude(haystack, needle, [message])\n\
   *\n\
   * Asserts that `haystack` does not include `needle`. Works\n\
   * for strings and arrays.\n\
   *i\n\
   *     assert.notInclude('foobar', 'baz', 'string not include substring');\n\
   *     assert.notInclude([ 1, 2, 3 ], 4, 'array not include contain value');\n\
   *\n\
   * @name notInclude\n\
   * @param {Array|String} haystack\n\
   * @param {Mixed} needle\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notInclude = function (exp, inc, msg) {\n\
    var obj = new Assertion(exp, msg);\n\
\n\
    if (Array.isArray(exp)) {\n\
      obj.to.not.include(inc);\n\
    } else if ('string' === typeof exp) {\n\
      obj.to.not.contain.string(inc);\n\
    } else {\n\
      throw new chai.AssertionError(\n\
          'expected an array or string'\n\
        , null\n\
        , assert.notInclude\n\
      );\n\
    }\n\
  };\n\
\n\
  /**\n\
   * ### .match(value, regexp, [message])\n\
   *\n\
   * Asserts that `value` matches the regular expression `regexp`.\n\
   *\n\
   *     assert.match('foobar', /^foo/, 'regexp matches');\n\
   *\n\
   * @name match\n\
   * @param {Mixed} value\n\
   * @param {RegExp} regexp\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.match = function (exp, re, msg) {\n\
    new Assertion(exp, msg).to.match(re);\n\
  };\n\
\n\
  /**\n\
   * ### .notMatch(value, regexp, [message])\n\
   *\n\
   * Asserts that `value` does not match the regular expression `regexp`.\n\
   *\n\
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');\n\
   *\n\
   * @name notMatch\n\
   * @param {Mixed} value\n\
   * @param {RegExp} regexp\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notMatch = function (exp, re, msg) {\n\
    new Assertion(exp, msg).to.not.match(re);\n\
  };\n\
\n\
  /**\n\
   * ### .property(object, property, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property`.\n\
   *\n\
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');\n\
   *\n\
   * @name property\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.property = function (obj, prop, msg) {\n\
    new Assertion(obj, msg).to.have.property(prop);\n\
  };\n\
\n\
  /**\n\
   * ### .notProperty(object, property, [message])\n\
   *\n\
   * Asserts that `object` does _not_ have a property named by `property`.\n\
   *\n\
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');\n\
   *\n\
   * @name notProperty\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notProperty = function (obj, prop, msg) {\n\
    new Assertion(obj, msg).to.not.have.property(prop);\n\
  };\n\
\n\
  /**\n\
   * ### .deepProperty(object, property, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property`, which can be a\n\
   * string using dot- and bracket-notation for deep reference.\n\
   *\n\
   *     assert.deepProperty({ tea: { green: 'matcha' }}, 'tea.green');\n\
   *\n\
   * @name deepProperty\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.deepProperty = function (obj, prop, msg) {\n\
    new Assertion(obj, msg).to.have.deep.property(prop);\n\
  };\n\
\n\
  /**\n\
   * ### .notDeepProperty(object, property, [message])\n\
   *\n\
   * Asserts that `object` does _not_ have a property named by `property`, which\n\
   * can be a string using dot- and bracket-notation for deep reference.\n\
   *\n\
   *     assert.notDeepProperty({ tea: { green: 'matcha' }}, 'tea.oolong');\n\
   *\n\
   * @name notDeepProperty\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.notDeepProperty = function (obj, prop, msg) {\n\
    new Assertion(obj, msg).to.not.have.deep.property(prop);\n\
  };\n\
\n\
  /**\n\
   * ### .propertyVal(object, property, value, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property` with value given\n\
   * by `value`.\n\
   *\n\
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');\n\
   *\n\
   * @name propertyVal\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.propertyVal = function (obj, prop, val, msg) {\n\
    new Assertion(obj, msg).to.have.property(prop, val);\n\
  };\n\
\n\
  /**\n\
   * ### .propertyNotVal(object, property, value, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property`, but with a value\n\
   * different from that given by `value`.\n\
   *\n\
   *     assert.propertyNotVal({ tea: 'is good' }, 'tea', 'is bad');\n\
   *\n\
   * @name propertyNotVal\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.propertyNotVal = function (obj, prop, val, msg) {\n\
    new Assertion(obj, msg).to.not.have.property(prop, val);\n\
  };\n\
\n\
  /**\n\
   * ### .deepPropertyVal(object, property, value, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property` with value given\n\
   * by `value`. `property` can use dot- and bracket-notation for deep\n\
   * reference.\n\
   *\n\
   *     assert.deepPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');\n\
   *\n\
   * @name deepPropertyVal\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.deepPropertyVal = function (obj, prop, val, msg) {\n\
    new Assertion(obj, msg).to.have.deep.property(prop, val);\n\
  };\n\
\n\
  /**\n\
   * ### .deepPropertyNotVal(object, property, value, [message])\n\
   *\n\
   * Asserts that `object` has a property named by `property`, but with a value\n\
   * different from that given by `value`. `property` can use dot- and\n\
   * bracket-notation for deep reference.\n\
   *\n\
   *     assert.deepPropertyNotVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');\n\
   *\n\
   * @name deepPropertyNotVal\n\
   * @param {Object} object\n\
   * @param {String} property\n\
   * @param {Mixed} value\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.deepPropertyNotVal = function (obj, prop, val, msg) {\n\
    new Assertion(obj, msg).to.not.have.deep.property(prop, val);\n\
  };\n\
\n\
  /**\n\
   * ### .lengthOf(object, length, [message])\n\
   *\n\
   * Asserts that `object` has a `length` property with the expected value.\n\
   *\n\
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');\n\
   *     assert.lengthOf('foobar', 5, 'string has length of 6');\n\
   *\n\
   * @name lengthOf\n\
   * @param {Mixed} object\n\
   * @param {Number} length\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.lengthOf = function (exp, len, msg) {\n\
    new Assertion(exp, msg).to.have.length(len);\n\
  };\n\
\n\
  /**\n\
   * ### .throws(function, [constructor/string/regexp], [string/regexp], [message])\n\
   *\n\
   * Asserts that `function` will throw an error that is an instance of\n\
   * `constructor`, or alternately that it will throw an error with message\n\
   * matching `regexp`.\n\
   *\n\
   *     assert.throw(fn, 'function throws a reference error');\n\
   *     assert.throw(fn, /function throws a reference error/);\n\
   *     assert.throw(fn, ReferenceError);\n\
   *     assert.throw(fn, ReferenceError, 'function throws a reference error');\n\
   *     assert.throw(fn, ReferenceError, /function throws a reference error/);\n\
   *\n\
   * @name throws\n\
   * @alias throw\n\
   * @alias Throw\n\
   * @param {Function} function\n\
   * @param {ErrorConstructor} constructor\n\
   * @param {RegExp} regexp\n\
   * @param {String} message\n\
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types\n\
   * @api public\n\
   */\n\
\n\
  assert.Throw = function (fn, errt, errs, msg) {\n\
    if ('string' === typeof errt || errt instanceof RegExp) {\n\
      errs = errt;\n\
      errt = null;\n\
    }\n\
\n\
    new Assertion(fn, msg).to.Throw(errt, errs);\n\
  };\n\
\n\
  /**\n\
   * ### .doesNotThrow(function, [constructor/regexp], [message])\n\
   *\n\
   * Asserts that `function` will _not_ throw an error that is an instance of\n\
   * `constructor`, or alternately that it will not throw an error with message\n\
   * matching `regexp`.\n\
   *\n\
   *     assert.doesNotThrow(fn, Error, 'function does not throw');\n\
   *\n\
   * @name doesNotThrow\n\
   * @param {Function} function\n\
   * @param {ErrorConstructor} constructor\n\
   * @param {RegExp} regexp\n\
   * @param {String} message\n\
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types\n\
   * @api public\n\
   */\n\
\n\
  assert.doesNotThrow = function (fn, type, msg) {\n\
    if ('string' === typeof type) {\n\
      msg = type;\n\
      type = null;\n\
    }\n\
\n\
    new Assertion(fn, msg).to.not.Throw(type);\n\
  };\n\
\n\
  /**\n\
   * ### .operator(val1, operator, val2, [message])\n\
   *\n\
   * Compares two values using `operator`.\n\
   *\n\
   *     assert.operator(1, '<', 2, 'everything is ok');\n\
   *     assert.operator(1, '>', 2, 'this will fail');\n\
   *\n\
   * @name operator\n\
   * @param {Mixed} val1\n\
   * @param {String} operator\n\
   * @param {Mixed} val2\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.operator = function (val, operator, val2, msg) {\n\
    if (!~['==', '===', '>', '>=', '<', '<=', '!=', '!=='].indexOf(operator)) {\n\
      throw new Error('Invalid operator \"' + operator + '\"');\n\
    }\n\
    var test = new Assertion(eval(val + operator + val2), msg);\n\
    test.assert(\n\
        true === flag(test, 'object')\n\
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)\n\
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );\n\
  };\n\
\n\
  /**\n\
   * ### .closeTo(actual, expected, delta, [message])\n\
   *\n\
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.\n\
   *\n\
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');\n\
   *\n\
   * @name closeTo\n\
   * @param {Number} actual\n\
   * @param {Number} expected\n\
   * @param {Number} delta\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.closeTo = function (act, exp, delta, msg) {\n\
    new Assertion(act, msg).to.be.closeTo(exp, delta);\n\
  };\n\
\n\
  /**\n\
   * ### .sameMembers(set1, set2, [message])\n\
   *\n\
   * Asserts that `set1` and `set2` have the same members.\n\
   * Order is not taken into account.\n\
   *\n\
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');\n\
   *\n\
   * @name sameMembers\n\
   * @param {Array} superset\n\
   * @param {Array} subset\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.sameMembers = function (set1, set2, msg) {\n\
    new Assertion(set1, msg).to.have.same.members(set2);\n\
  }\n\
\n\
  /**\n\
   * ### .includeMembers(superset, subset, [message])\n\
   *\n\
   * Asserts that `subset` is included in `superset`.\n\
   * Order is not taken into account.\n\
   *\n\
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');\n\
   *\n\
   * @name includeMembers\n\
   * @param {Array} superset\n\
   * @param {Array} subset\n\
   * @param {String} message\n\
   * @api public\n\
   */\n\
\n\
  assert.includeMembers = function (superset, subset, msg) {\n\
    new Assertion(superset, msg).to.include.members(subset);\n\
  }\n\
\n\
  /*!\n\
   * Undocumented / untested\n\
   */\n\
\n\
  assert.ifError = function (val, msg) {\n\
    new Assertion(val, msg).to.not.be.ok;\n\
  };\n\
\n\
  /*!\n\
   * Aliases.\n\
   */\n\
\n\
  (function alias(name, as){\n\
    assert[as] = assert[name];\n\
    return alias;\n\
  })\n\
  ('Throw', 'throw')\n\
  ('Throw', 'throws');\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/interface/assert.js"
));
require.register("chaijs-chai/lib/chai/interface/expect.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
module.exports = function (chai, util) {\n\
  chai.expect = function (val, message) {\n\
    return new chai.Assertion(val, message);\n\
  };\n\
};\n\
\n\
//@ sourceURL=chaijs-chai/lib/chai/interface/expect.js"
));
require.register("chaijs-chai/lib/chai/interface/should.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * Copyright(c) 2011-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
module.exports = function (chai, util) {\n\
  var Assertion = chai.Assertion;\n\
\n\
  function loadShould () {\n\
    // modify Object.prototype to have `should`\n\
    Object.defineProperty(Object.prototype, 'should',\n\
      {\n\
        set: function (value) {\n\
          // See https://github.com/chaijs/chai/issues/86: this makes\n\
          // `whatever.should = someValue` actually set `someValue`, which is\n\
          // especially useful for `global.should = require('chai').should()`.\n\
          //\n\
          // Note that we have to use [[DefineProperty]] instead of [[Put]]\n\
          // since otherwise we would trigger this very setter!\n\
          Object.defineProperty(this, 'should', {\n\
            value: value,\n\
            enumerable: true,\n\
            configurable: true,\n\
            writable: true\n\
          });\n\
        }\n\
      , get: function(){\n\
          if (this instanceof String || this instanceof Number) {\n\
            return new Assertion(this.constructor(this));\n\
          } else if (this instanceof Boolean) {\n\
            return new Assertion(this == true);\n\
          }\n\
          return new Assertion(this);\n\
        }\n\
      , configurable: true\n\
    });\n\
\n\
    var should = {};\n\
\n\
    should.equal = function (val1, val2, msg) {\n\
      new Assertion(val1, msg).to.equal(val2);\n\
    };\n\
\n\
    should.Throw = function (fn, errt, errs, msg) {\n\
      new Assertion(fn, msg).to.Throw(errt, errs);\n\
    };\n\
\n\
    should.exist = function (val, msg) {\n\
      new Assertion(val, msg).to.exist;\n\
    }\n\
\n\
    // negation\n\
    should.not = {}\n\
\n\
    should.not.equal = function (val1, val2, msg) {\n\
      new Assertion(val1, msg).to.not.equal(val2);\n\
    };\n\
\n\
    should.not.Throw = function (fn, errt, errs, msg) {\n\
      new Assertion(fn, msg).to.not.Throw(errt, errs);\n\
    };\n\
\n\
    should.not.exist = function (val, msg) {\n\
      new Assertion(val, msg).to.not.exist;\n\
    }\n\
\n\
    should['throw'] = should['Throw'];\n\
    should.not['throw'] = should.not['Throw'];\n\
\n\
    return should;\n\
  };\n\
\n\
  chai.should = loadShould;\n\
  chai.Should = loadShould;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/interface/should.js"
));
require.register("chaijs-chai/lib/chai/utils/addChainableMethod.js", Function("exports, require, module",
"/*!\n\
 * Chai - addChainingMethod utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Module dependencies\n\
 */\n\
\n\
var transferFlags = require('./transferFlags');\n\
\n\
/*!\n\
 * Module variables\n\
 */\n\
\n\
// Check whether `__proto__` is supported\n\
var hasProtoSupport = '__proto__' in Object;\n\
\n\
// Without `__proto__` support, this module will need to add properties to a function.\n\
// However, some Function.prototype methods cannot be overwritten,\n\
// and there seems no easy cross-platform way to detect them (@see chaijs/chai/issues/69).\n\
var excludeNames = /^(?:length|name|arguments|caller)$/;\n\
\n\
// Cache `Function` properties\n\
var call  = Function.prototype.call,\n\
    apply = Function.prototype.apply;\n\
\n\
/**\n\
 * ### addChainableMethod (ctx, name, method, chainingBehavior)\n\
 *\n\
 * Adds a method to an object, such that the method can also be chained.\n\
 *\n\
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {\n\
 *       var obj = utils.flag(this, 'object');\n\
 *       new chai.Assertion(obj).to.be.equal(str);\n\
 *     });\n\
 *\n\
 * Can also be accessed directly from `chai.Assertion`.\n\
 *\n\
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);\n\
 *\n\
 * The result can then be used as both a method assertion, executing both `method` and\n\
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.\n\
 *\n\
 *     expect(fooStr).to.be.foo('bar');\n\
 *     expect(fooStr).to.be.foo.equal('foo');\n\
 *\n\
 * @param {Object} ctx object to which the method is added\n\
 * @param {String} name of method to add\n\
 * @param {Function} method function to be used for `name`, when called\n\
 * @param {Function} chainingBehavior function to be called every time the property is accessed\n\
 * @name addChainableMethod\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (ctx, name, method, chainingBehavior) {\n\
  if (typeof chainingBehavior !== 'function')\n\
    chainingBehavior = function () { };\n\
\n\
  Object.defineProperty(ctx, name,\n\
    { get: function () {\n\
        chainingBehavior.call(this);\n\
\n\
        var assert = function () {\n\
          var result = method.apply(this, arguments);\n\
          return result === undefined ? this : result;\n\
        };\n\
\n\
        // Use `__proto__` if available\n\
        if (hasProtoSupport) {\n\
          // Inherit all properties from the object by replacing the `Function` prototype\n\
          var prototype = assert.__proto__ = Object.create(this);\n\
          // Restore the `call` and `apply` methods from `Function`\n\
          prototype.call = call;\n\
          prototype.apply = apply;\n\
        }\n\
        // Otherwise, redefine all properties (slow!)\n\
        else {\n\
          var asserterNames = Object.getOwnPropertyNames(ctx);\n\
          asserterNames.forEach(function (asserterName) {\n\
            if (!excludeNames.test(asserterName)) {\n\
              var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);\n\
              Object.defineProperty(assert, asserterName, pd);\n\
            }\n\
          });\n\
        }\n\
\n\
        transferFlags(this, assert);\n\
        return assert;\n\
      }\n\
    , configurable: true\n\
  });\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/addChainableMethod.js"
));
require.register("chaijs-chai/lib/chai/utils/addMethod.js", Function("exports, require, module",
"/*!\n\
 * Chai - addMethod utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### .addMethod (ctx, name, method)\n\
 *\n\
 * Adds a method to the prototype of an object.\n\
 *\n\
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {\n\
 *       var obj = utils.flag(this, 'object');\n\
 *       new chai.Assertion(obj).to.be.equal(str);\n\
 *     });\n\
 *\n\
 * Can also be accessed directly from `chai.Assertion`.\n\
 *\n\
 *     chai.Assertion.addMethod('foo', fn);\n\
 *\n\
 * Then can be used as any other assertion.\n\
 *\n\
 *     expect(fooStr).to.be.foo('bar');\n\
 *\n\
 * @param {Object} ctx object to which the method is added\n\
 * @param {String} name of method to add\n\
 * @param {Function} method function to be used for name\n\
 * @name addMethod\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (ctx, name, method) {\n\
  ctx[name] = function () {\n\
    var result = method.apply(this, arguments);\n\
    return result === undefined ? this : result;\n\
  };\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/addMethod.js"
));
require.register("chaijs-chai/lib/chai/utils/addProperty.js", Function("exports, require, module",
"/*!\n\
 * Chai - addProperty utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### addProperty (ctx, name, getter)\n\
 *\n\
 * Adds a property to the prototype of an object.\n\
 *\n\
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {\n\
 *       var obj = utils.flag(this, 'object');\n\
 *       new chai.Assertion(obj).to.be.instanceof(Foo);\n\
 *     });\n\
 *\n\
 * Can also be accessed directly from `chai.Assertion`.\n\
 *\n\
 *     chai.Assertion.addProperty('foo', fn);\n\
 *\n\
 * Then can be used as any other assertion.\n\
 *\n\
 *     expect(myFoo).to.be.foo;\n\
 *\n\
 * @param {Object} ctx object to which the property is added\n\
 * @param {String} name of property to add\n\
 * @param {Function} getter function to be used for name\n\
 * @name addProperty\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (ctx, name, getter) {\n\
  Object.defineProperty(ctx, name,\n\
    { get: function () {\n\
        var result = getter.call(this);\n\
        return result === undefined ? this : result;\n\
      }\n\
    , configurable: true\n\
  });\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/addProperty.js"
));
require.register("chaijs-chai/lib/chai/utils/flag.js", Function("exports, require, module",
"/*!\n\
 * Chai - flag utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### flag(object ,key, [value])\n\
 *\n\
 * Get or set a flag value on an object. If a\n\
 * value is provided it will be set, else it will\n\
 * return the currently set value or `undefined` if\n\
 * the value is not set.\n\
 *\n\
 *     utils.flag(this, 'foo', 'bar'); // setter\n\
 *     utils.flag(this, 'foo'); // getter, returns `bar`\n\
 *\n\
 * @param {Object} object (constructed Assertion\n\
 * @param {String} key\n\
 * @param {Mixed} value (optional)\n\
 * @name flag\n\
 * @api private\n\
 */\n\
\n\
module.exports = function (obj, key, value) {\n\
  var flags = obj.__flags || (obj.__flags = Object.create(null));\n\
  if (arguments.length === 3) {\n\
    flags[key] = value;\n\
  } else {\n\
    return flags[key];\n\
  }\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/flag.js"
));
require.register("chaijs-chai/lib/chai/utils/getActual.js", Function("exports, require, module",
"/*!\n\
 * Chai - getActual utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * # getActual(object, [actual])\n\
 *\n\
 * Returns the `actual` value for an Assertion\n\
 *\n\
 * @param {Object} object (constructed Assertion)\n\
 * @param {Arguments} chai.Assertion.prototype.assert arguments\n\
 */\n\
\n\
module.exports = function (obj, args) {\n\
  var actual = args[4];\n\
  return 'undefined' !== typeof actual ? actual : obj._obj;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getActual.js"
));
require.register("chaijs-chai/lib/chai/utils/getEnumerableProperties.js", Function("exports, require, module",
"/*!\n\
 * Chai - getEnumerableProperties utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### .getEnumerableProperties(object)\n\
 *\n\
 * This allows the retrieval of enumerable property names of an object,\n\
 * inherited or not.\n\
 *\n\
 * @param {Object} object\n\
 * @returns {Array}\n\
 * @name getEnumerableProperties\n\
 * @api public\n\
 */\n\
\n\
module.exports = function getEnumerableProperties(object) {\n\
  var result = [];\n\
  for (var name in object) {\n\
    result.push(name);\n\
  }\n\
  return result;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getEnumerableProperties.js"
));
require.register("chaijs-chai/lib/chai/utils/getMessage.js", Function("exports, require, module",
"/*!\n\
 * Chai - message composition utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Module dependancies\n\
 */\n\
\n\
var flag = require('./flag')\n\
  , getActual = require('./getActual')\n\
  , inspect = require('./inspect')\n\
  , objDisplay = require('./objDisplay');\n\
\n\
/**\n\
 * ### .getMessage(object, message, negateMessage)\n\
 *\n\
 * Construct the error message based on flags\n\
 * and template tags. Template tags will return\n\
 * a stringified inspection of the object referenced.\n\
 *\n\
 * Message template tags:\n\
 * - `#{this}` current asserted object\n\
 * - `#{act}` actual value\n\
 * - `#{exp}` expected value\n\
 *\n\
 * @param {Object} object (constructed Assertion)\n\
 * @param {Arguments} chai.Assertion.prototype.assert arguments\n\
 * @name getMessage\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (obj, args) {\n\
  var negate = flag(obj, 'negate')\n\
    , val = flag(obj, 'object')\n\
    , expected = args[3]\n\
    , actual = getActual(obj, args)\n\
    , msg = negate ? args[2] : args[1]\n\
    , flagMsg = flag(obj, 'message');\n\
\n\
  msg = msg || '';\n\
  msg = msg\n\
    .replace(/#{this}/g, objDisplay(val))\n\
    .replace(/#{act}/g, objDisplay(actual))\n\
    .replace(/#{exp}/g, objDisplay(expected));\n\
\n\
  return flagMsg ? flagMsg + ': ' + msg : msg;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getMessage.js"
));
require.register("chaijs-chai/lib/chai/utils/getName.js", Function("exports, require, module",
"/*!\n\
 * Chai - getName utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * # getName(func)\n\
 *\n\
 * Gets the name of a function, in a cross-browser way.\n\
 *\n\
 * @param {Function} a function (usually a constructor)\n\
 */\n\
\n\
module.exports = function (func) {\n\
  if (func.name) return func.name;\n\
\n\
  var match = /^\\s?function ([^(]*)\\(/.exec(func);\n\
  return match && match[1] ? match[1] : \"\";\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getName.js"
));
require.register("chaijs-chai/lib/chai/utils/getPathValue.js", Function("exports, require, module",
"/*!\n\
 * Chai - getPathValue utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * @see https://github.com/logicalparadox/filtr\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### .getPathValue(path, object)\n\
 *\n\
 * This allows the retrieval of values in an\n\
 * object given a string path.\n\
 *\n\
 *     var obj = {\n\
 *         prop1: {\n\
 *             arr: ['a', 'b', 'c']\n\
 *           , str: 'Hello'\n\
 *         }\n\
 *       , prop2: {\n\
 *             arr: [ { nested: 'Universe' } ]\n\
 *           , str: 'Hello again!'\n\
 *         }\n\
 *     }\n\
 *\n\
 * The following would be the results.\n\
 *\n\
 *     getPathValue('prop1.str', obj); // Hello\n\
 *     getPathValue('prop1.att[2]', obj); // b\n\
 *     getPathValue('prop2.arr[0].nested', obj); // Universe\n\
 *\n\
 * @param {String} path\n\
 * @param {Object} object\n\
 * @returns {Object} value or `undefined`\n\
 * @name getPathValue\n\
 * @api public\n\
 */\n\
\n\
var getPathValue = module.exports = function (path, obj) {\n\
  var parsed = parsePath(path);\n\
  return _getPathValue(parsed, obj);\n\
};\n\
\n\
/*!\n\
 * ## parsePath(path)\n\
 *\n\
 * Helper function used to parse string object\n\
 * paths. Use in conjunction with `_getPathValue`.\n\
 *\n\
 *      var parsed = parsePath('myobject.property.subprop');\n\
 *\n\
 * ### Paths:\n\
 *\n\
 * * Can be as near infinitely deep and nested\n\
 * * Arrays are also valid using the formal `myobject.document[3].property`.\n\
 *\n\
 * @param {String} path\n\
 * @returns {Object} parsed\n\
 * @api private\n\
 */\n\
\n\
function parsePath (path) {\n\
  var str = path.replace(/\\[/g, '.[')\n\
    , parts = str.match(/(\\\\\\.|[^.]+?)+/g);\n\
  return parts.map(function (value) {\n\
    var re = /\\[(\\d+)\\]$/\n\
      , mArr = re.exec(value)\n\
    if (mArr) return { i: parseFloat(mArr[1]) };\n\
    else return { p: value };\n\
  });\n\
};\n\
\n\
/*!\n\
 * ## _getPathValue(parsed, obj)\n\
 *\n\
 * Helper companion function for `.parsePath` that returns\n\
 * the value located at the parsed address.\n\
 *\n\
 *      var value = getPathValue(parsed, obj);\n\
 *\n\
 * @param {Object} parsed definition from `parsePath`.\n\
 * @param {Object} object to search against\n\
 * @returns {Object|Undefined} value\n\
 * @api private\n\
 */\n\
\n\
function _getPathValue (parsed, obj) {\n\
  var tmp = obj\n\
    , res;\n\
  for (var i = 0, l = parsed.length; i < l; i++) {\n\
    var part = parsed[i];\n\
    if (tmp) {\n\
      if ('undefined' !== typeof part.p)\n\
        tmp = tmp[part.p];\n\
      else if ('undefined' !== typeof part.i)\n\
        tmp = tmp[part.i];\n\
      if (i == (l - 1)) res = tmp;\n\
    } else {\n\
      res = undefined;\n\
    }\n\
  }\n\
  return res;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getPathValue.js"
));
require.register("chaijs-chai/lib/chai/utils/getProperties.js", Function("exports, require, module",
"/*!\n\
 * Chai - getProperties utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### .getProperties(object)\n\
 *\n\
 * This allows the retrieval of property names of an object, enumerable or not,\n\
 * inherited or not.\n\
 *\n\
 * @param {Object} object\n\
 * @returns {Array}\n\
 * @name getProperties\n\
 * @api public\n\
 */\n\
\n\
module.exports = function getProperties(object) {\n\
  var result = Object.getOwnPropertyNames(subject);\n\
\n\
  function addProperty(property) {\n\
    if (result.indexOf(property) === -1) {\n\
      result.push(property);\n\
    }\n\
  }\n\
\n\
  var proto = Object.getPrototypeOf(subject);\n\
  while (proto !== null) {\n\
    Object.getOwnPropertyNames(proto).forEach(addProperty);\n\
    proto = Object.getPrototypeOf(proto);\n\
  }\n\
\n\
  return result;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/getProperties.js"
));
require.register("chaijs-chai/lib/chai/utils/index.js", Function("exports, require, module",
"/*!\n\
 * chai\n\
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Main exports\n\
 */\n\
\n\
var exports = module.exports = {};\n\
\n\
/*!\n\
 * test utility\n\
 */\n\
\n\
exports.test = require('./test');\n\
\n\
/*!\n\
 * type utility\n\
 */\n\
\n\
exports.type = require('./type');\n\
\n\
/*!\n\
 * message utility\n\
 */\n\
\n\
exports.getMessage = require('./getMessage');\n\
\n\
/*!\n\
 * actual utility\n\
 */\n\
\n\
exports.getActual = require('./getActual');\n\
\n\
/*!\n\
 * Inspect util\n\
 */\n\
\n\
exports.inspect = require('./inspect');\n\
\n\
/*!\n\
 * Object Display util\n\
 */\n\
\n\
exports.objDisplay = require('./objDisplay');\n\
\n\
/*!\n\
 * Flag utility\n\
 */\n\
\n\
exports.flag = require('./flag');\n\
\n\
/*!\n\
 * Flag transferring utility\n\
 */\n\
\n\
exports.transferFlags = require('./transferFlags');\n\
\n\
/*!\n\
 * Deep equal utility\n\
 */\n\
\n\
exports.eql = require('deep-eql');\n\
\n\
/*!\n\
 * Deep path value\n\
 */\n\
\n\
exports.getPathValue = require('./getPathValue');\n\
\n\
/*!\n\
 * Function name\n\
 */\n\
\n\
exports.getName = require('./getName');\n\
\n\
/*!\n\
 * add Property\n\
 */\n\
\n\
exports.addProperty = require('./addProperty');\n\
\n\
/*!\n\
 * add Method\n\
 */\n\
\n\
exports.addMethod = require('./addMethod');\n\
\n\
/*!\n\
 * overwrite Property\n\
 */\n\
\n\
exports.overwriteProperty = require('./overwriteProperty');\n\
\n\
/*!\n\
 * overwrite Method\n\
 */\n\
\n\
exports.overwriteMethod = require('./overwriteMethod');\n\
\n\
/*!\n\
 * Add a chainable method\n\
 */\n\
\n\
exports.addChainableMethod = require('./addChainableMethod');\n\
\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/index.js"
));
require.register("chaijs-chai/lib/chai/utils/inspect.js", Function("exports, require, module",
"// This is (almost) directly from Node.js utils\n\
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js\n\
\n\
var getName = require('./getName');\n\
var getProperties = require('./getProperties');\n\
var getEnumerableProperties = require('./getEnumerableProperties');\n\
\n\
module.exports = inspect;\n\
\n\
/**\n\
 * Echos the value of a value. Trys to print the value out\n\
 * in the best way possible given the different types.\n\
 *\n\
 * @param {Object} obj The object to print out.\n\
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)\n\
 *    properties of objects.\n\
 * @param {Number} depth Depth in which to descend in object. Default is 2.\n\
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the\n\
 *    output. Default is false (no coloring).\n\
 */\n\
function inspect(obj, showHidden, depth, colors) {\n\
  var ctx = {\n\
    showHidden: showHidden,\n\
    seen: [],\n\
    stylize: function (str) { return str; }\n\
  };\n\
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));\n\
}\n\
\n\
// https://gist.github.com/1044128/\n\
var getOuterHTML = function(element) {\n\
  if ('outerHTML' in element) return element.outerHTML;\n\
  var ns = \"http://www.w3.org/1999/xhtml\";\n\
  var container = document.createElementNS(ns, '_');\n\
  var elemProto = (window.HTMLElement || window.Element).prototype;\n\
  var xmlSerializer = new XMLSerializer();\n\
  var html;\n\
  if (document.xmlVersion) {\n\
    return xmlSerializer.serializeToString(element);\n\
  } else {\n\
    container.appendChild(element.cloneNode(false));\n\
    html = container.innerHTML.replace('><', '>' + element.innerHTML + '<');\n\
    container.innerHTML = '';\n\
    return html;\n\
  }\n\
};\n\
\n\
// Returns true if object is a DOM element.\n\
var isDOMElement = function (object) {\n\
  if (typeof HTMLElement === 'object') {\n\
    return object instanceof HTMLElement;\n\
  } else {\n\
    return object &&\n\
      typeof object === 'object' &&\n\
      object.nodeType === 1 &&\n\
      typeof object.nodeName === 'string';\n\
  }\n\
};\n\
\n\
function formatValue(ctx, value, recurseTimes) {\n\
  // Provide a hook for user-specified inspect functions.\n\
  // Check that value is an object with an inspect function on it\n\
  if (value && typeof value.inspect === 'function' &&\n\
      // Filter out the util module, it's inspect function is special\n\
      value.inspect !== exports.inspect &&\n\
      // Also filter out any prototype objects using the circular check.\n\
      !(value.constructor && value.constructor.prototype === value)) {\n\
    var ret = value.inspect(recurseTimes);\n\
    if (typeof ret !== 'string') {\n\
      ret = formatValue(ctx, ret, recurseTimes);\n\
    }\n\
    return ret;\n\
  }\n\
\n\
  // Primitive types cannot have properties\n\
  var primitive = formatPrimitive(ctx, value);\n\
  if (primitive) {\n\
    return primitive;\n\
  }\n\
\n\
  // If it's DOM elem, get outer HTML.\n\
  if (isDOMElement(value)) {\n\
    return getOuterHTML(value);\n\
  }\n\
\n\
  // Look up the keys of the object.\n\
  var visibleKeys = getEnumerableProperties(value);\n\
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;\n\
\n\
  // Some type of object without properties can be shortcutted.\n\
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,\n\
  // a `stack` plus `description` property; ignore those for consistency.\n\
  if (keys.length === 0 || (isError(value) && (\n\
      (keys.length === 1 && keys[0] === 'stack') ||\n\
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')\n\
     ))) {\n\
    if (typeof value === 'function') {\n\
      var name = getName(value);\n\
      var nameSuffix = name ? ': ' + name : '';\n\
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');\n\
    }\n\
    if (isRegExp(value)) {\n\
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n\
    }\n\
    if (isDate(value)) {\n\
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');\n\
    }\n\
    if (isError(value)) {\n\
      return formatError(value);\n\
    }\n\
  }\n\
\n\
  var base = '', array = false, braces = ['{', '}'];\n\
\n\
  // Make Array say that they are Array\n\
  if (isArray(value)) {\n\
    array = true;\n\
    braces = ['[', ']'];\n\
  }\n\
\n\
  // Make functions say that they are functions\n\
  if (typeof value === 'function') {\n\
    var name = getName(value);\n\
    var nameSuffix = name ? ': ' + name : '';\n\
    base = ' [Function' + nameSuffix + ']';\n\
  }\n\
\n\
  // Make RegExps say that they are RegExps\n\
  if (isRegExp(value)) {\n\
    base = ' ' + RegExp.prototype.toString.call(value);\n\
  }\n\
\n\
  // Make dates with properties first say the date\n\
  if (isDate(value)) {\n\
    base = ' ' + Date.prototype.toUTCString.call(value);\n\
  }\n\
\n\
  // Make error with message first say the error\n\
  if (isError(value)) {\n\
    return formatError(value);\n\
  }\n\
\n\
  if (keys.length === 0 && (!array || value.length == 0)) {\n\
    return braces[0] + base + braces[1];\n\
  }\n\
\n\
  if (recurseTimes < 0) {\n\
    if (isRegExp(value)) {\n\
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');\n\
    } else {\n\
      return ctx.stylize('[Object]', 'special');\n\
    }\n\
  }\n\
\n\
  ctx.seen.push(value);\n\
\n\
  var output;\n\
  if (array) {\n\
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);\n\
  } else {\n\
    output = keys.map(function(key) {\n\
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);\n\
    });\n\
  }\n\
\n\
  ctx.seen.pop();\n\
\n\
  return reduceToSingleString(output, base, braces);\n\
}\n\
\n\
\n\
function formatPrimitive(ctx, value) {\n\
  switch (typeof value) {\n\
    case 'undefined':\n\
      return ctx.stylize('undefined', 'undefined');\n\
\n\
    case 'string':\n\
      var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n\
                                               .replace(/'/g, \"\\\\'\")\n\
                                               .replace(/\\\\\"/g, '\"') + '\\'';\n\
      return ctx.stylize(simple, 'string');\n\
\n\
    case 'number':\n\
      return ctx.stylize('' + value, 'number');\n\
\n\
    case 'boolean':\n\
      return ctx.stylize('' + value, 'boolean');\n\
  }\n\
  // For some reason typeof null is \"object\", so special case here.\n\
  if (value === null) {\n\
    return ctx.stylize('null', 'null');\n\
  }\n\
}\n\
\n\
\n\
function formatError(value) {\n\
  return '[' + Error.prototype.toString.call(value) + ']';\n\
}\n\
\n\
\n\
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {\n\
  var output = [];\n\
  for (var i = 0, l = value.length; i < l; ++i) {\n\
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {\n\
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n\
          String(i), true));\n\
    } else {\n\
      output.push('');\n\
    }\n\
  }\n\
  keys.forEach(function(key) {\n\
    if (!key.match(/^\\d+$/)) {\n\
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n\
          key, true));\n\
    }\n\
  });\n\
  return output;\n\
}\n\
\n\
\n\
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {\n\
  var name, str;\n\
  if (value.__lookupGetter__) {\n\
    if (value.__lookupGetter__(key)) {\n\
      if (value.__lookupSetter__(key)) {\n\
        str = ctx.stylize('[Getter/Setter]', 'special');\n\
      } else {\n\
        str = ctx.stylize('[Getter]', 'special');\n\
      }\n\
    } else {\n\
      if (value.__lookupSetter__(key)) {\n\
        str = ctx.stylize('[Setter]', 'special');\n\
      }\n\
    }\n\
  }\n\
  if (visibleKeys.indexOf(key) < 0) {\n\
    name = '[' + key + ']';\n\
  }\n\
  if (!str) {\n\
    if (ctx.seen.indexOf(value[key]) < 0) {\n\
      if (recurseTimes === null) {\n\
        str = formatValue(ctx, value[key], null);\n\
      } else {\n\
        str = formatValue(ctx, value[key], recurseTimes - 1);\n\
      }\n\
      if (str.indexOf('\\n\
') > -1) {\n\
        if (array) {\n\
          str = str.split('\\n\
').map(function(line) {\n\
            return '  ' + line;\n\
          }).join('\\n\
').substr(2);\n\
        } else {\n\
          str = '\\n\
' + str.split('\\n\
').map(function(line) {\n\
            return '   ' + line;\n\
          }).join('\\n\
');\n\
        }\n\
      }\n\
    } else {\n\
      str = ctx.stylize('[Circular]', 'special');\n\
    }\n\
  }\n\
  if (typeof name === 'undefined') {\n\
    if (array && key.match(/^\\d+$/)) {\n\
      return str;\n\
    }\n\
    name = JSON.stringify('' + key);\n\
    if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n\
      name = name.substr(1, name.length - 2);\n\
      name = ctx.stylize(name, 'name');\n\
    } else {\n\
      name = name.replace(/'/g, \"\\\\'\")\n\
                 .replace(/\\\\\"/g, '\"')\n\
                 .replace(/(^\"|\"$)/g, \"'\");\n\
      name = ctx.stylize(name, 'string');\n\
    }\n\
  }\n\
\n\
  return name + ': ' + str;\n\
}\n\
\n\
\n\
function reduceToSingleString(output, base, braces) {\n\
  var numLinesEst = 0;\n\
  var length = output.reduce(function(prev, cur) {\n\
    numLinesEst++;\n\
    if (cur.indexOf('\\n\
') >= 0) numLinesEst++;\n\
    return prev + cur.length + 1;\n\
  }, 0);\n\
\n\
  if (length > 60) {\n\
    return braces[0] +\n\
           (base === '' ? '' : base + '\\n\
 ') +\n\
           ' ' +\n\
           output.join(',\\n\
  ') +\n\
           ' ' +\n\
           braces[1];\n\
  }\n\
\n\
  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n\
}\n\
\n\
function isArray(ar) {\n\
  return Array.isArray(ar) ||\n\
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');\n\
}\n\
\n\
function isRegExp(re) {\n\
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';\n\
}\n\
\n\
function isDate(d) {\n\
  return typeof d === 'object' && objectToString(d) === '[object Date]';\n\
}\n\
\n\
function isError(e) {\n\
  return typeof e === 'object' && objectToString(e) === '[object Error]';\n\
}\n\
\n\
function objectToString(o) {\n\
  return Object.prototype.toString.call(o);\n\
}\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/inspect.js"
));
require.register("chaijs-chai/lib/chai/utils/objDisplay.js", Function("exports, require, module",
"/*!\n\
 * Chai - flag utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Module dependancies\n\
 */\n\
\n\
var inspect = require('./inspect');\n\
\n\
/**\n\
 * ### .objDisplay (object)\n\
 *\n\
 * Determines if an object or an array matches\n\
 * criteria to be inspected in-line for error\n\
 * messages or should be truncated.\n\
 *\n\
 * @param {Mixed} javascript object to inspect\n\
 * @name objDisplay\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (obj) {\n\
  var str = inspect(obj)\n\
    , type = Object.prototype.toString.call(obj);\n\
\n\
  if (str.length >= 40) {\n\
    if (type === '[object Function]') {\n\
      return !obj.name || obj.name === ''\n\
        ? '[Function]'\n\
        : '[Function: ' + obj.name + ']';\n\
    } else if (type === '[object Array]') {\n\
      return '[ Array(' + obj.length + ') ]';\n\
    } else if (type === '[object Object]') {\n\
      var keys = Object.keys(obj)\n\
        , kstr = keys.length > 2\n\
          ? keys.splice(0, 2).join(', ') + ', ...'\n\
          : keys.join(', ');\n\
      return '{ Object (' + kstr + ') }';\n\
    } else {\n\
      return str;\n\
    }\n\
  } else {\n\
    return str;\n\
  }\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/objDisplay.js"
));
require.register("chaijs-chai/lib/chai/utils/overwriteMethod.js", Function("exports, require, module",
"/*!\n\
 * Chai - overwriteMethod utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### overwriteMethod (ctx, name, fn)\n\
 *\n\
 * Overwites an already existing method and provides\n\
 * access to previous function. Must return function\n\
 * to be used for name.\n\
 *\n\
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {\n\
 *       return function (str) {\n\
 *         var obj = utils.flag(this, 'object');\n\
 *         if (obj instanceof Foo) {\n\
 *           new chai.Assertion(obj.value).to.equal(str);\n\
 *         } else {\n\
 *           _super.apply(this, arguments);\n\
 *         }\n\
 *       }\n\
 *     });\n\
 *\n\
 * Can also be accessed directly from `chai.Assertion`.\n\
 *\n\
 *     chai.Assertion.overwriteMethod('foo', fn);\n\
 *\n\
 * Then can be used as any other assertion.\n\
 *\n\
 *     expect(myFoo).to.equal('bar');\n\
 *\n\
 * @param {Object} ctx object whose method is to be overwritten\n\
 * @param {String} name of method to overwrite\n\
 * @param {Function} method function that returns a function to be used for name\n\
 * @name overwriteMethod\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (ctx, name, method) {\n\
  var _method = ctx[name]\n\
    , _super = function () { return this; };\n\
\n\
  if (_method && 'function' === typeof _method)\n\
    _super = _method;\n\
\n\
  ctx[name] = function () {\n\
    var result = method(_super).apply(this, arguments);\n\
    return result === undefined ? this : result;\n\
  }\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/overwriteMethod.js"
));
require.register("chaijs-chai/lib/chai/utils/overwriteProperty.js", Function("exports, require, module",
"/*!\n\
 * Chai - overwriteProperty utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### overwriteProperty (ctx, name, fn)\n\
 *\n\
 * Overwites an already existing property getter and provides\n\
 * access to previous value. Must return function to use as getter.\n\
 *\n\
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {\n\
 *       return function () {\n\
 *         var obj = utils.flag(this, 'object');\n\
 *         if (obj instanceof Foo) {\n\
 *           new chai.Assertion(obj.name).to.equal('bar');\n\
 *         } else {\n\
 *           _super.call(this);\n\
 *         }\n\
 *       }\n\
 *     });\n\
 *\n\
 *\n\
 * Can also be accessed directly from `chai.Assertion`.\n\
 *\n\
 *     chai.Assertion.overwriteProperty('foo', fn);\n\
 *\n\
 * Then can be used as any other assertion.\n\
 *\n\
 *     expect(myFoo).to.be.ok;\n\
 *\n\
 * @param {Object} ctx object whose property is to be overwritten\n\
 * @param {String} name of property to overwrite\n\
 * @param {Function} getter function that returns a getter function to be used for name\n\
 * @name overwriteProperty\n\
 * @api public\n\
 */\n\
\n\
module.exports = function (ctx, name, getter) {\n\
  var _get = Object.getOwnPropertyDescriptor(ctx, name)\n\
    , _super = function () {};\n\
\n\
  if (_get && 'function' === typeof _get.get)\n\
    _super = _get.get\n\
\n\
  Object.defineProperty(ctx, name,\n\
    { get: function () {\n\
        var result = getter(_super).call(this);\n\
        return result === undefined ? this : result;\n\
      }\n\
    , configurable: true\n\
  });\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/overwriteProperty.js"
));
require.register("chaijs-chai/lib/chai/utils/test.js", Function("exports, require, module",
"/*!\n\
 * Chai - test utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Module dependancies\n\
 */\n\
\n\
var flag = require('./flag');\n\
\n\
/**\n\
 * # test(object, expression)\n\
 *\n\
 * Test and object for expression.\n\
 *\n\
 * @param {Object} object (constructed Assertion)\n\
 * @param {Arguments} chai.Assertion.prototype.assert arguments\n\
 */\n\
\n\
module.exports = function (obj, args) {\n\
  var negate = flag(obj, 'negate')\n\
    , expr = args[0];\n\
  return negate ? !expr : expr;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/test.js"
));
require.register("chaijs-chai/lib/chai/utils/transferFlags.js", Function("exports, require, module",
"/*!\n\
 * Chai - transferFlags utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/**\n\
 * ### transferFlags(assertion, object, includeAll = true)\n\
 *\n\
 * Transfer all the flags for `assertion` to `object`. If\n\
 * `includeAll` is set to `false`, then the base Chai\n\
 * assertion flags (namely `object`, `ssfi`, and `message`)\n\
 * will not be transferred.\n\
 *\n\
 *\n\
 *     var newAssertion = new Assertion();\n\
 *     utils.transferFlags(assertion, newAssertion);\n\
 *\n\
 *     var anotherAsseriton = new Assertion(myObj);\n\
 *     utils.transferFlags(assertion, anotherAssertion, false);\n\
 *\n\
 * @param {Assertion} assertion the assertion to transfer the flags from\n\
 * @param {Object} object the object to transfer the flags too; usually a new assertion\n\
 * @param {Boolean} includeAll\n\
 * @name getAllFlags\n\
 * @api private\n\
 */\n\
\n\
module.exports = function (assertion, object, includeAll) {\n\
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));\n\
\n\
  if (!object.__flags) {\n\
    object.__flags = Object.create(null);\n\
  }\n\
\n\
  includeAll = arguments.length === 3 ? includeAll : true;\n\
\n\
  for (var flag in flags) {\n\
    if (includeAll ||\n\
        (flag !== 'object' && flag !== 'ssfi' && flag != 'message')) {\n\
      object.__flags[flag] = flags[flag];\n\
    }\n\
  }\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/transferFlags.js"
));
require.register("chaijs-chai/lib/chai/utils/type.js", Function("exports, require, module",
"/*!\n\
 * Chai - type utility\n\
 * Copyright(c) 2012-2013 Jake Luer <jake@alogicalparadox.com>\n\
 * MIT Licensed\n\
 */\n\
\n\
/*!\n\
 * Detectable javascript natives\n\
 */\n\
\n\
var natives = {\n\
    '[object Arguments]': 'arguments'\n\
  , '[object Array]': 'array'\n\
  , '[object Date]': 'date'\n\
  , '[object Function]': 'function'\n\
  , '[object Number]': 'number'\n\
  , '[object RegExp]': 'regexp'\n\
  , '[object String]': 'string'\n\
};\n\
\n\
/**\n\
 * ### type(object)\n\
 *\n\
 * Better implementation of `typeof` detection that can\n\
 * be used cross-browser. Handles the inconsistencies of\n\
 * Array, `null`, and `undefined` detection.\n\
 *\n\
 *     utils.type({}) // 'object'\n\
 *     utils.type(null) // `null'\n\
 *     utils.type(undefined) // `undefined`\n\
 *     utils.type([]) // `array`\n\
 *\n\
 * @param {Mixed} object to detect type of\n\
 * @name type\n\
 * @api private\n\
 */\n\
\n\
module.exports = function (obj) {\n\
  var str = Object.prototype.toString.call(obj);\n\
  if (natives[str]) return natives[str];\n\
  if (obj === null) return 'null';\n\
  if (obj === undefined) return 'undefined';\n\
  if (obj === Object(obj)) return 'object';\n\
  return typeof obj;\n\
};\n\
//@ sourceURL=chaijs-chai/lib/chai/utils/type.js"
));
require.register("sldr/index.js", Function("exports, require, module",
"/**\n\
* Module dependencies\n\
 */\n\
\n\
var query = require('query');\n\
var domify = require('domify');\n\
var events = require('events');\n\
var Emitter = require('emitter');\n\
var translate = require('translate');\n\
var constrain = require('constrain');\n\
var template = require('./template');\n\
\n\
\n\
/**\n\
 * Expose `Sldr`\n\
 */\n\
\n\
module.exports = Sldr;\n\
\n\
\n\
/**\n\
 * Initialize `Sldr`\n\
 *\n\
 * @param {Number} initial value (Optional)\n\
 * @param {Number} min value (Optional)\n\
 * @param {Number} max value (Optional)\n\
 *\n\
 */\n\
\n\
function Sldr(value, min, max){\n\
\n\
  this.el = domify(this.template);\n\
  this.wrapEl = query('.wrap', this.el);\n\
  this.valueEl = query('.label-value', this.el);\n\
  this.gaugeEl = query('.gauge', this.el);\n\
  this.minEl = query('.label-min', this.el);\n\
  this.maxEl = query('.label-max', this.el);\n\
  \n\
  this._min = min || 0;\n\
  this._max = max || 100;\n\
  this._value = constrain(value || 0, this._min, this._max);\n\
\n\
  this.bind();\n\
}\n\
\n\
/**\n\
 * Emitter\n\
 */\n\
\n\
Emitter(Sldr.prototype);\n\
\n\
\n\
/**\n\
 * Template\n\
 */\n\
\n\
Sldr.prototype.template = template;\n\
\n\
/**\n\
 * Bind dom events\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.bind = function() {\n\
  this.events = events(this.el, this);\n\
  this.bodyEvents = events(document.body, this);\n\
  this.events.bind('mousedown', 'touchstart');\n\
  this.events.bind('touchstart', 'touchstart');\n\
};\n\
\n\
\n\
/**\n\
 * Unbind all the DOM events and remove all the listeners\n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.unbind = function() {\n\
  this.events.unbind();\n\
  this.bodyEvents.unbind();\n\
  this.off();\n\
};\n\
\n\
/**\n\
 * Mousedown or touchstart event handler\n\
 * @param {Event}\n\
 * \n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.touchstart = function(e) {\n\
  e.preventDefault();\n\
\n\
  this._width = this.el.clientWidth;\n\
  this._left = this.el.offsetLeft;\n\
\n\
  var percentage = constrain((e.pageX - this._left) / this._width, 0, 100);\n\
  this.value(percentage * (this._max - this._min));\n\
\n\
  this.bodyEvents.bind('mousemove', 'touchmove');\n\
  this.bodyEvents.bind('mouseup', 'touchend');\n\
  this.bodyEvents.bind('touchmove', 'touchmove');\n\
  this.bodyEvents.bind('touchend', 'touchend');\n\
\n\
};\n\
\n\
\n\
/**\n\
 * Mousemove or touchmove event handler bound to body\n\
 * @param {Event}\n\
 * \n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.touchmove = function(e) {\n\
  e.preventDefault();\n\
  this.el.classList.add('is-active');\n\
  var percentage = constrain((e.pageX - this._left) / this._width, 0, 100);\n\
  this.value(percentage * (this._max - this._min));\n\
};\n\
\n\
\n\
/**\n\
 * Mouseup or touchend event handler bound to body\n\
 * @param {Event}\n\
 * \n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.touchend = function(e) {\n\
  e.preventDefault();\n\
  this.el.classList.remove('is-active');\n\
  this.bodyEvents.unbind();\n\
};\n\
\n\
\n\
/**\n\
 * Position value label\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.positionLabel = function() {\n\
\n\
  if(!this._width) this._width = this.el.clientWidth;\n\
\n\
  var w = this.valueEl.clientWidth;\n\
  var x = 0;\n\
  var padding = 20;\n\
  var offset = this.percentage() / 100 * this._width;\n\
  \n\
  // Check if there's enough room for label to be in\n\
  if(w + padding < offset){\n\
    this.valueEl.classList.remove('is-close-zero');\n\
    x = offset - w - padding / 2;\n\
  } else {\n\
    this.valueEl.classList.add('is-close-zero');\n\
    x = offset + padding / 2;\n\
  }\n\
  translate(this.valueEl, x, 0);\n\
\n\
};\n\
\n\
\n\
/**\n\
 * Get or set `value`\n\
 *\n\
 * @param {Number} value to set\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.value = function(val) {\n\
  if (arguments.length) {\n\
    this._value = constrain(val, this._min, this._max);\n\
    this.update();\n\
    this.emit('change', this._value);\n\
  } else {\n\
    return this._value;\n\
  }\n\
};\n\
\n\
\n\
/**\n\
 * Get or set `min` for range.\n\
 *\n\
 * @param {Number} min value to set\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.min = function(val) {\n\
  if (arguments.length) {\n\
    this._min = val;\n\
    this.update();\n\
  } else {\n\
    return this._min;\n\
  }\n\
};\n\
\n\
/**\n\
 * Get or set `max` for range.\n\
 *\n\
 * @param {Number} max value to set\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.max = function(val) {\n\
  if (arguments.length) {\n\
    this._max = val;\n\
    this.update();\n\
  } else {\n\
    return this._max;\n\
  }\n\
};\n\
\n\
/**\n\
 * Update DOM Elements\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Sldr.prototype.update = function() {\n\
  \n\
  // Update value;\n\
  this.valueEl.innerText = this.format(this._value);\n\
  this.positionLabel();\n\
\n\
  // Update gauge\n\
  var x = -(100 - this.percentage()) + '%';\n\
  translate(this.gaugeEl, x, 0);\n\
\n\
  // Update min / max\n\
  this.minEl.innerText = this.format(this._min);\n\
  this.maxEl.innerText = this.format(this._max);\n\
\n\
};\n\
\n\
/**\n\
 * Returns the percentage of current value in the range of `min`, `max`\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.percentage = function(v) {\n\
  v = v || this._value;\n\
  return (this._value - this._min) / (this._max - this._min) * 100;\n\
};\n\
\n\
/**\n\
 * Format values for labels\n\
 *\n\
 * @param {Number} value to format\n\
 * @return {String}\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.format = function(v){\n\
  var val = '' + Math.round( v * 100 ) / 100;\n\
  if(!/\\./.test(val)) val += '.00';\n\
  return val;\n\
}\n\
\n\
/**\n\
 * Destroy `Sldr` instance\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Sldr.prototype.destroy = function() {\n\
  this.unbind();\n\
  this.el.parentElement && this.el.parentElement.removeChild(this.el);\n\
  this.el = null;\n\
};\n\
//@ sourceURL=sldr/index.js"
));
require.register("sldr/template.js", Function("exports, require, module",
"module.exports = '<div class=\"sldr\">\\n\
  <div class=\"wrap\">\\n\
    <div class=\"label-value\"></div>\\n\
    <div class=\"gauge\"></div>\\n\
  </div>\\n\
  <div class=\"label-wrap\">\\n\
    <span class=\"label-min\"></span><span class=\"label-max\"></span>\\n\
  </div>\\n\
</div>\\n\
';//@ sourceURL=sldr/template.js"
));




















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

require.alias("chaijs-chai/index.js", "sldr/deps/chai/index.js");
require.alias("chaijs-chai/lib/chai.js", "sldr/deps/chai/lib/chai.js");
require.alias("chaijs-chai/lib/chai/assertion.js", "sldr/deps/chai/lib/chai/assertion.js");
require.alias("chaijs-chai/lib/chai/core/assertions.js", "sldr/deps/chai/lib/chai/core/assertions.js");
require.alias("chaijs-chai/lib/chai/interface/assert.js", "sldr/deps/chai/lib/chai/interface/assert.js");
require.alias("chaijs-chai/lib/chai/interface/expect.js", "sldr/deps/chai/lib/chai/interface/expect.js");
require.alias("chaijs-chai/lib/chai/interface/should.js", "sldr/deps/chai/lib/chai/interface/should.js");
require.alias("chaijs-chai/lib/chai/utils/addChainableMethod.js", "sldr/deps/chai/lib/chai/utils/addChainableMethod.js");
require.alias("chaijs-chai/lib/chai/utils/addMethod.js", "sldr/deps/chai/lib/chai/utils/addMethod.js");
require.alias("chaijs-chai/lib/chai/utils/addProperty.js", "sldr/deps/chai/lib/chai/utils/addProperty.js");
require.alias("chaijs-chai/lib/chai/utils/flag.js", "sldr/deps/chai/lib/chai/utils/flag.js");
require.alias("chaijs-chai/lib/chai/utils/getActual.js", "sldr/deps/chai/lib/chai/utils/getActual.js");
require.alias("chaijs-chai/lib/chai/utils/getEnumerableProperties.js", "sldr/deps/chai/lib/chai/utils/getEnumerableProperties.js");
require.alias("chaijs-chai/lib/chai/utils/getMessage.js", "sldr/deps/chai/lib/chai/utils/getMessage.js");
require.alias("chaijs-chai/lib/chai/utils/getName.js", "sldr/deps/chai/lib/chai/utils/getName.js");
require.alias("chaijs-chai/lib/chai/utils/getPathValue.js", "sldr/deps/chai/lib/chai/utils/getPathValue.js");
require.alias("chaijs-chai/lib/chai/utils/getProperties.js", "sldr/deps/chai/lib/chai/utils/getProperties.js");
require.alias("chaijs-chai/lib/chai/utils/index.js", "sldr/deps/chai/lib/chai/utils/index.js");
require.alias("chaijs-chai/lib/chai/utils/inspect.js", "sldr/deps/chai/lib/chai/utils/inspect.js");
require.alias("chaijs-chai/lib/chai/utils/objDisplay.js", "sldr/deps/chai/lib/chai/utils/objDisplay.js");
require.alias("chaijs-chai/lib/chai/utils/overwriteMethod.js", "sldr/deps/chai/lib/chai/utils/overwriteMethod.js");
require.alias("chaijs-chai/lib/chai/utils/overwriteProperty.js", "sldr/deps/chai/lib/chai/utils/overwriteProperty.js");
require.alias("chaijs-chai/lib/chai/utils/test.js", "sldr/deps/chai/lib/chai/utils/test.js");
require.alias("chaijs-chai/lib/chai/utils/transferFlags.js", "sldr/deps/chai/lib/chai/utils/transferFlags.js");
require.alias("chaijs-chai/lib/chai/utils/type.js", "sldr/deps/chai/lib/chai/utils/type.js");
require.alias("chaijs-chai/index.js", "sldr/deps/chai/index.js");
require.alias("chaijs-chai/index.js", "chai/index.js");
require.alias("chaijs-assertion-error/index.js", "chaijs-chai/deps/assertion-error/index.js");
require.alias("chaijs-assertion-error/index.js", "chaijs-chai/deps/assertion-error/index.js");
require.alias("chaijs-assertion-error/index.js", "chaijs-assertion-error/index.js");
require.alias("chaijs-deep-eql/lib/eql.js", "chaijs-chai/deps/deep-eql/lib/eql.js");
require.alias("chaijs-deep-eql/lib/eql.js", "chaijs-chai/deps/deep-eql/index.js");
require.alias("chaijs-type-detect/lib/type.js", "chaijs-deep-eql/deps/type-detect/lib/type.js");
require.alias("chaijs-type-detect/lib/type.js", "chaijs-deep-eql/deps/type-detect/index.js");
require.alias("chaijs-type-detect/lib/type.js", "chaijs-type-detect/index.js");
require.alias("chaijs-deep-eql/lib/eql.js", "chaijs-deep-eql/index.js");
require.alias("chaijs-chai/index.js", "chaijs-chai/index.js");
require.alias("sldr/index.js", "sldr/index.js");