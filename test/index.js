var Sldr = require('sldr');
var chai = require('chai');
var should = chai.should();
var transform = require('component-transform-property');

if(!/debug/.test(location.search)){

describe('Sldr', function(){
  it('should exist', function(){
    should.exist(Sldr);
  });

  describe('instance', function(){

    beforeEach(function(){
      this.slider = new Sldr();
    });

    afterEach(function(){
      this.slider = null;
    });

    it('should have root el', function(){
      should.exist(this.slider.el);
    });

    it('should set value', function(){
      this.slider.should.respondTo('value');
      this.slider.value(100);
      this.slider.value().should.equal(100);
    });
    
    it('should constrain value', function(){
      this.slider.should.respondTo('value');
      this.slider.value(200);
      this.slider.value().should.equal(100);
      this.slider.value(-50);
      this.slider.value().should.equal(0);
    });

    it('should emit change event when value is set', function(done){

      var self = this;
      this.slider.should.respondTo('on');
      this.slider.on('change', function(val){
        self.slider.value().should.equal(val);
        done();
      });
      setTimeout(function(){ self.slider.value(100); }, 100);

    });

    it('should not emit change event when skipEmit is true', function(done){

      var self = this;
      var called = false;

      this.slider.skipEmit = true;

      this.slider.on('change', function(val){
        called = true;
      });

      setTimeout(function(){
        called.should.not.be.ok;
        done();
      }, 100);

      this.slider.value(100);

    });


    it('should calculate percentage value', function(){

      this.slider.max(50);
      this.slider.min(-50);
      this.slider.value(0);
      this.slider.percentage().should.equal(50);
      
      this.slider.max(100);
      this.slider.min(50);
      this.slider.value(100);
      this.slider.percentage().should.equal(100);

    });

    it('should have value gauge element', function(){
      this.slider.should.have.property('gaugeEl');
      this.slider.value(100);
      this.slider.gaugeEl.style[transform].should.match(/0%, 0/);
      this.slider.value(0);
      this.slider.gaugeEl.style[transform].should.match(/100%, 0/);
    });

  });

});


} else{

  // Testing by hand
  var meta = document.createElement('meta');
  meta.setAttribute('name', 'viewport');
  meta.setAttribute('content', 'width=device-width, user-scalable=no');
  document.head.appendChild(meta);
  document.body.style.backgroundColor = '#FDF4E9';

  var colors = ['#ECDF61', '#00A8D7', '#FF4D49'];
  window.sliders = [];
  colors.forEach(function(color, i){
    var slider = window.slider = new Sldr();
    document.body.appendChild(slider.el);
    sliders.push(slider);

    slider.el.style.width = '280px';
    slider.el.style.margin = '20px auto 20px';
    slider.wrapEl.style.height = '50px';
    slider.gaugeEl.style.backgroundColor = color;

    slider.value(0);

    var randomize = setInterval(function(){
      slider.value(Math.random() * 100)
    }, 2000);

    var _touchstart = slider.touchstart;

    slider.touchstart = function(){
      clearTimeout(randomize);
      _touchstart.apply(this, arguments);
    }
  });

}


