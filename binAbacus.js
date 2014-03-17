(function($){
  $.binAbacus = function(abacus, numBits, options){
    // abacus:    the target element containing the actual abacus
    // numBits:   size of the abacus in binary digits, default is 8
    // options:   optional object with configuration, all defaults are reasonable

    // To avoid scope issues, use 'base' instead of 'this'
    var base = this;
    
    // Access to jQuery and DOM versions of the target element
    base.$abacus = $(abacus);
    base.abacus = abacus;
    
    // Add a reverse reference to the DOM object
    base.$abacus.data('binAbacus', base);
    
    // reference the target element, add the event handlers
    base.init = function(){

    // abacus size in bits, default is 8
    if( typeof( numBits ) === 'undefined' || numBits === null ) numBits = 8;
    base.numBits = numBits;
    
    base.options = $.extend( {}, $.binAbacus.defaultOptions, options );

    // TODO: clear the target elelent and create the abacus elements
    
    // toggle a ball position when clicked
    // TODO: >>>> this selector below must be constrained to base
    $('.ba_bit').on(
      'click', 
      function(e) {
        var $this = $(this);
        // switch the ball position
        $this.toggleClass('ba_1 ba_0'); 
        // get a ref to the displayed bit container
        var theBitOrder = $this.attr('id').substr(9)  // the "0" in "bit_ball_0";
        // change the displayed bit value 0/1
        $(document.getElementById( 'bit_digit_' + theBitOrder )).text( ( $this.hasClass( 'ba_1' ) ? '1' : '0' ) );
        // calculate the value
        var numValue = 0;
        for( var i = 0; i < 8; i++ ) {
          numValue +=  ($(document.getElementById( 'bit_ball_' + i )).hasClass( 'ba_1' )) ? ((Math.pow(2, i))) : 0;
        };
        console.log( 'item: ' + theBitOrder + '  value: ' + numValue );
        $('#binAbacus .ba_numValue').text( numValue );
      }
    )

    // make a click when the ball hits the other side
    $('.ba_bit').on(
      'transitionend', 
      function(e) {
        // play the click sound
        document.getElementById('ba_clickSound').cloneNode(true).play();
      }
    );

    // add 1 to the binary value when the button is clicked
    $('#binAbacus .ba_addOne').on(
      'click',
      // scan the bits from right to left flipping the bits until
      // a zero is reached
      function() {
        for( var i = 0; i < 8; i++ ) {
          // flip bit # i, if bit #i was zero exit loop
          var $thisBit =  $(document.getElementById( 'bit_ball_' + i ));
          $thisBit.click();
          if( $thisBit.hasClass( 'ba_1' ) ) {
            break;
          };
        };
      }
    );

  };
  
  // Sample Function, Uncomment to use
  // base.functionName = function(paramaters){
  // 
  // };
  // setValue
  // clear
  // addOne
  
  // Run initializer
  base.init();
};

$.binAbacus.defaultOptions = {
    // ball image (default embedded)
    // silent (default no)
    // click volume (default 0.3)
    // [click sound (default embedded)] in one or more audio formats
    // ball travel time (default 0.4s)
    // easing function (default 'ease-in')
};

$.fn.binAbacus = function(numBits, options){
  return this.each(function(){
    (new $.binAbacus( this, numBits, options ));

       // HAVE YOUR PLUGIN DO STUFF HERE 

  });
};

})(jQuery);
