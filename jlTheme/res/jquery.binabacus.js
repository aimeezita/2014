(function ( $, window, document, undefined ) {

  // create the defaults once
  var
    pluginName = 'binabacus',
    defaults = {
      numBits: 8,                           // number of bits
      startValue: 0,                        // the initial numeric value displayed
      ballImage: null,                      // ball image (default embedded)
      silent: false,                        // silent (default no)
      clickVolume: 0.3,                     // click volume (default 0.3)
      clickSound: 'ba_clicksound',          // id of an <audio> element providing the ball's click
      ballTravelTime: '0.3s',               // ball travel time (default 0.3s)
      ballEasing: 'ease-in'                 // easing function (default 'ease-in')
    };

  // the actual plugin constructor
  function Plugin ( element, options ) {
    this.element = element;
    // merge options with defaults into this.settings
    this.settings = $.extend( {}, defaults, options );
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {  // this.element is the target DOM element, this.settings is the merged options object

    // build the HTML of an audio element loaded with the ball's click, once per page
    buildAudio: function() {

      if( document.getElementById( this.settings.clickSound )) {
        // don't create nothing, it's already there
      } else {
        // build the default <audio> with two embedded sources: MP3 and OGG
        var audioHTML =
        '<audio id="ba_clickSound" preload="auto" volume="' + this.settings.clickVolume + '" style="display:none">' +
        this.audioMP3 +
        this.audioOGG +
        '</audio>';
        $('body').append( audioHTML );
      }
    },

    buildAbacus: function() {

      // clean the target
      $(this.element).empty();

      var
        i = 0,
        row0 = [],
        row1 = [],
        HTMLText =
          '<div>' +
          '  <!-- the abacus itself -->' +
          '  <table>' +
          '    <tbody>' +
          '      <tr> <!-- first row: animated black balls -->' +
          '        #first-row#' +
          '      </tr>' +
          '      <tr> <!-- second row: displayed digit values -->' +
          '        #second-row#' +
          '      </tr>' +
          '    </tbody>' +
          '  </table>' +
          '  <div class="ba_numValue">&nbsp;</div>' +
          '  <button class="ba_addOne">+1</button>' +
          '</div>';
      // build the <td>s of the table rows, one cell per bit
      for( i = 0; i < this.settings.numBits; i++ ) {
        row0.push( '<td class="ba_bit ba_0" title="' + Math.pow(2, i ) + '">&nbsp;</td>' );
        row1.push( '<td class="ba_digit">0</td>' );
      }
      // insert the table rows in place and set the HTML in the page
      $(this.element).addClass( 'ba_abacus' );
      $(this.element).html( HTMLText.replace( '#first-row#', row0.reverse().join( '' ) )
      .replace( '#second-row#', row1.reverse().join( '' ) ) );

      // apply options for ball travel time and easing if present, the css method
      // returns something like "background-position 0.3s ease-in 0s"
      var 
        animCSS = $('.ba_abacus td.ba_bit').css( 'transition' ).split( ' ' ),
        changed = false;
      if( animCSS[0] === 'background-position' ) {
        if( this.settings.ballTravelTime !== defaults.ballTravelTime ) {
          animCSS[1] = this.settings.ballTravelTime;
          changed = true;
        }
        if( this.settings.ballEasing !== defaults.ballEasing ) {
          animCSS[2] = this.settings.ballEasing;
          changed = true;
        }
        if( changed ) {
          $( '.ba_abacus td.ba_bit' ).css( 'transition', animCSS.join(' ') );
        }
      }
    },

    init: function () {
      // clear the target element and create the abacus elements
      this.buildAudio();
      this.buildAbacus();
      // TODO: load the initial value

      // create references to the target DOM element
      var
        target = this.element;

      // toggle this ball's state when clicked, adjust displayed numeric bit value
      $( '.ba_bit', target ).on(
        'click',
        function(e) {
          var $this = $(this);
          // switch the ball position
          $this.toggleClass('ba_1 ba_0');
          // get a ref to the cell that displays the bit value 0/1 (next row, same column) and toggle it
          var $theBitValueCell =  $(this.parentElement.nextElementSibling).find('td:eq(' + this.cellIndex +')' );
          $theBitValueCell.text( $this.hasClass( 'ba_1' ) ? '1' : '0' );
          // get a reference to the settings object
          var theSettings = $(this).closest( '.ba_abacus' ).data('plugin_binabacus').settings;
          // calculate the numeric value looping over the ball cells (the value is the class)
          var
            numValue = 0,
            bitValue = 1,
            $theBitCells =  $(this.parentElement).children( 'td.ba_bit' );
          for( var i = theSettings.numBits - 1; i >= 0; i-- ) {
            numValue += $( $theBitCells[i] ).hasClass( 'ba_1' ) ? bitValue : 0;
            bitValue *= 2;
          }
          $('#binAbacus .ba_numValue').text( numValue );
        }
      );

      // make a click sound when the ball hits the other side
      if( this.settings.silent ) {
        // don't set this event handler
      } else {
        $( '.ba_bit', target ).on(
          'transitionend',
          function(e) {
            // play the click sound
            document.getElementById( 'ba_clickSound' ).cloneNode(true).play();
          }
        );
      }

      // add 1 to the number value when the [+1] button is clicked
      $( '.ba_addOne', target ).on(
        'click',
        // scan the bits from right to left flipping them until a zero is reached
        function() {
          // get a reference to the settings object
          var theSettings = $(this).closest( '.ba_abacus' ).data('plugin_binabacus').settings;
          // do the addition loop
          var
            $theBitCells = $(this).closest( '.ba_abacus' ).find( 'tr:eq(0)' ),
            $theBitCell = null;
          for( var i = theSettings.numBits - 1; i >= 0; i-- ) {
            $theBitCell = $( $theBitCells.children( 'td.ba_bit' )[i] );
            $theBitCell.click();
            if( $theBitCell.hasClass( 'ba_1' ) ) {
              break;
            }
          }
        }
      );

    },

    // you can add more functions like the one below and
    // call them like so: this.yourOtherFunction(this.element, this.settings).
    // console.log('xD');
    yourOtherFunction: function () {
      // some logic
    },

    // lengthy literals at the bottom of the file, to lessen scroll during edition
    audioMP3:
      '<source type="audio/mp3" src="data:audio/ogg;base64,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' +
      'pZSSUkoppVJKKaWUUkopJaWUUkqllFJKKaWUUkpKKaWUUiqllFJKKaWUlFJKKaVUSimllFJKKSmllFJKqZRSSimllFJSSimllFIp' +
      'pZRSSimlpJRSSimllEoppZRSSikAAOjAAQAgwIhKC7HTjCuPwBGFDBNQoSErAYCQAADAEOmklFJKKaWUUkkppZRSSimllFIqCaWU' +
      'UkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWU' +
      'UkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWU' +
      'UkoppZRSAGB0hgNg9IQRdJJRZRE2mnDhASg0ZCUAkBYAABjDGGOMOSchlZhqrJRyzjnHoKMQU201Rko555xzEFKKqcacg+ecgxA6' +
      'Cq3EVFuNwXPOQQihlJRijLXn4FrnIJSSUkuxxVZjb61zEEpJqbUYa805CCFCCCm11mKMvdYahBAddFRai7HWnHsPQrhWSmotxhpz' +
      'rj0HIVwrnYXYas01996DEEKo1Fqtteeeew5CCCFUaCWmXHsPvucghBA6t1Zr7j33HoQQQghbW6kpt+BzDz4IIYQQMtZaexA+CCGE' +
      'EEIIGWLLsfcghBBCCCGEDrbm3oMPPgghhBBCCBtz78EHIQwAyI1wAEBcMJKQOsuw0ogbT8AQgRQasgoAiAEAGAKAIBAwAAAwwQEA' +
      'IMAKdmWWVm0UN3WSF30Q+ISO2IwMuZSKmZwIeqSGWqwEO7SCG7wALDRkJQBABgDAMAihgxJ7ZJBizEHrFUKIMSgtZwoZpByU2DGG' +
      'EGJQWsaYQkgxaZ1zjCGkIHUQOqcUclRSaymEDlqsOdfWUooBAAAQBAAICAkAMEBQMAMADA4QRg4EOgIIHNoAAAMRMhMYFEKDg0wA' +
      'eICIkAoAEhMUpQtdEEIE6SLI4oELJ248ccMJHdpAAAAAAABAAOADACChACKimZmrsLjAyNDY4Ojw+AAJERkRAAAAAAAgAPgAAEhI' +
      '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' +
      'AAAAFwBMAQ4ODg4ODg4ODg4ODg4ODg4ODg4ODg==">',

    audioOGG:
      '<source type="audio/ogg" src="data:audio/mp3;base64,//PEBAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAbAAAq' +
      'AAAJCQkSEhISHBwcHCUlJS8vLy84ODg4QkJCS0tLS1VVVVVeXl5eaGhocXFxcXt7e3uEhISOjo6Ol5eXl6Ghoaqqqqq0tLS0vb29' +
      'vcfHx9DQ0NDa2tra4+Pj7e3t7fb29vb///8AAAA5TEFNRTMuOTlyAXgAAAAAAAAAABSAJAKJJgAAgAAAKgDSDbREAAAAAAAAAAAA' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//PEBAAQ4S82sKCYAKHKXm1hQTAAYJgAAAAB' +
      'jAAC8AxzMYxjIECBAgQIEIu77GECCF3ZMmTAYWTCAAAAAQIIZ4z3d72u7u9////gwggndnkwGAwtPGiIjPcREQQIEECd3ZMmTT3/' +
      '/vdpkCCERERF3d2TsPd4eHhgA78A8PDw8MAAAAM//4Bh4e////Aw8///MP6GCP///AAwAAAAYJgAAAABjAAC8AxjGMYxjIECBAgQ' +
      'IEIu77GECCF3ZMmTJkyYQAAAAAgghnjPd3vi7u73///+DCCBO7PJgMBhaeNERGe4iIggQIIE7uyZMmnv//e7sgQQiIiIu7uydg/g' +
      '+D4OAg6UB8HwfB8HAQBAEDnUCYPg+/4Jg+f5cH1g4GPlAQKAgCAIKqdZd4Z6VkNDEOkAAAgYUhiddltP2h1rRQF+jPUMyQsORcqZ' +
      'R4VCoPI6L5ga+ToVsZCUN/tZSKhvc3jEk1yKcweuYpdi5s/VjJxSCbw08bqoUSFfFta/gKyIz6vV//PEBFwZ1etvi8e8ADOL0usf' +
      'j3gBifrC4z/jWMYiIez7iZ3DMpiVp/RlKy01a2N//3vg63P+mt/3TyealFPbEFitauf/////e9Kafv48e+8U1f2iV3S2V6a9KR4m' +
      'I+f/j/4/t8f3f2iP3OnzHpr6+XlP/1Zp9p63Q65pSHTM0O826mMIPAyIvstczTzjwqsxDHGUAQSy64TgtrsgqdodaWIAT6M9OjJc' +
      'xYFyilHhUIwxjIvK2f5UCGxjJOnftY/EIRaPZGJdrkjTB9Zim8XNn6sZOSQx4aeRLIdRxZxbWv4CsiM+t1hR1hcZ+MaxjFFe/3T7' +
      'uqoT1itBi01u2P//99Xx/6a/91cnmpXT28F9a1c/////++6U0/hx49/6av9xNbpbLVNelI8TEfOf8f/H9vj+7+1H8enzH1r6+YlP' +
      '/1ZMxVesT+uYERveZiQ48Q/6OcV2cp2aP2cjYBZFow0ZVVswkg2SASET558llG8gigco1aj1WL77+1+lrPpC6JYh//PEBCoWKf1T' +
      'IOSwAKxL+qZByWABB8WRHX3Vo69AiqoLFUT6R/r1rvTNoWdbWPzzSSAxLyxCNWo7HJOQmKWosfv7+23qetMirZ6z+wqOhm2TP9lf' +
      '3tnpvnOzM9szk0nvt927zdvmtcu7Dd6YupOf1Ptb+6fys3pLGa2sSPsxKMVtP2pXYVE9BLMeLG7W+mwv5Mf4xuW6m3ZvDPLEztm5' +
      'GAWRaUkyqrZhJBskBhFs8+SdQ/GCKByjVqPVYvtn9r9LWfSF0SxCD4siOvurR16BFVQWKon0j/XrXemchZ1tY/NGkkBiXliEatR2' +
      'OSchMUtRY/f39tvU9aZFWz1n9hUdDNsmf7K/vbPTfOdmZ7ZnJpPfb7t3m7fNa5d2G70xdSc/qfa390/ldvSWM1tYkfZiUYraftSu' +
      'wqJ6CWY8WN2t9NhfyY/xiHLdTbs3hnlidZrJogAUG9RPM3FVZqUUWNFF4xm3KpQmuruxp2wimtPXYlpi15gVxccC8gjSlTjnSBo5' +
      '//PEBDIVqeFLICWGmKsbwpYgSw0xZlkyJrqU8Qz1trGo292aVs1yZ9LzqYnIJkbLi0PokcaCgTcilFFblJUSyDSh16KvU1DnRNnM' +
      '9VVU3nHee/2n8/zJpySXfzk01f/eR3O29uxoKAQCRRNU+yRCTSOfWOJLcokWEuRg7ZKOJTPNRJEtY0jMkSIKiTRTYp2XJrZuAODe' +
      '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' +
      'ulUKV5/JglWvvnhy8TlGnJgfvDydr2GPgbPkRUJxOX45e5kW0CItEAnpEvxnKk9G//PEBP8WJbkIATDD8q9regwAYkfNkmqFFDhx' +
      't89jZHDABBOBJOWZIxIvMGXppFeUkgbJZuSRJtHxoZJYxiSvWuRVlzUjpM+nKH9XDNrsksV1NZZ6cY5HVV5SzrsTTXtltTPqb4Mt' +
      'JxhZZEc4x5hSrkTunDB4P86Udpb/77kz9prSrflgTkxBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqqmSaXi1Ww8kUBRoJT9Dp8SSy' +
      'XhJWCU9Zla6dMHyUstLo3WmBKfJJNcJROvY6jW4lPWjIxSE5/mVK6G7taHzZi4ISQtMwNqV2tUeslUnRk2ST5KTemAyVBKjWnKk6' +
      'hYeZeZdz6wPAqyJHDqdEUYkbnZJ0dnPTy1TBJJyKNUbBJKcrTdmcjXwqMd9SCrwaCjBoLC5LzH7cbRFQqKaFHQkpvP/5YyU143hU' +
      'Vk87EgHpIipmXEQ8AU2KYTQwImlRUuS51pahmys0qzklUyVQVNWQs1FDBrrNKoUSpLDyeytBqVsr//PEBOAVUWz2ADDD8qg0OfgM' +
      'SgfAIkwyMjrSqT2aVuPWmhZWFTiI1fVQoCogWFnNaUFqKaa1QCRmq7GAgya9Jj28vqmqwM1UmomNVjbf7VTVY3DCmXVjGtJj1LZS' +
      'arG62sYKM1BiYwE4CTfS2bX6TfVoVYzahWMKAowEysfqqAVqTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq' +
      'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq' +
      'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq' +
      'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq">'

  };

  // a really lightweight plugin wrapper around the constructor, preventing against multiple instantiations
  $.fn[ pluginName ] = function ( settings ) {
    this.each(function() {
      if ( !$.data( this, 'plugin_' + pluginName ) ) {
        $.data( this, 'plugin_' + pluginName, new Plugin( this, settings ) );
      }
    });

    // chain jQuery functions
    return this;
  };

})( jQuery, window, document );
