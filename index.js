/**
* Module dependencies
 */

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
