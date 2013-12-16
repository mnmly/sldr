# Sldr

  Just because default sliders are hard to touch and difficult to tweak.  
  
  ![](http://f.cl.ly/items/3V1j1T3C03301M202q04/sldr-crop.gif)

  ☞ [Demo](http://mnmly.github.io/sldr/)


## Installation

  Install with [component(1)](http://component.io):

    $ component install mnmly/slider

## Example

```javascript

var slider = new Sldr();
document.body.appendChild(slider.el);

// You should style those by css
slider.el.style.width = '280px';
slider.el.style.margin = '20px auto';
slider.wrapEl.style.height = '50px';
slider.gaugeEl.style.backgroundColor = 'orange';

// Set value to 0
slider.value(0);

var randomize = setInterval(function(){
  // Set random value
  slider.value(Math.random() * 100)
}, 2000);

var _touchstart = slider.touchstart;

slider.touchstart = function(){
  // if there's randomize interval, kill it.
  clearTimeout(randomize);
  _touchstart.apply(this, arguments);
}

slider.on('change', function(v){
  console.log('New value is ' + v);
});
```

## API

  - [Sldr()](#slider)
  - [Sldr::value()](#slidervaluevaluenumber)
  - [Sldr::min()](#sliderminminnumber)
  - [Sldr::max()](#slidermaxmaxnumber)
  - [Sldr::percentage()](#sliderpercentage)
  - [Sldr::format()](#sliderformatvaluenumber)
  - [Sldr::destroy()](#sliderdestroy)

## Sldr(value, min, max)

  - `value`: Intial value (default to 100)
  - `min`: min value (default to 0)
  - `max`: max value (default to 100)

  Initialize `Sldr`

## Sldr::value(val:Number)

  Get or set `value`

## Sldr::min(min:Number)

  Get or set `min` for range.

## Sldr::max(max:Number)

  Get or set `max` for range.

## Sldr::percentage()

  Returns the percentage of current value in the range of `min`, `max`

## Sldr::format(value:Number)

  Format values for labels, override this to customize format

## Sldr::destroy()

  Destroy `Sldr` instance


## Events

  - [change](#change)


## License

  MIT
