function Settings( defaults, options ) {
// a class' settings object, made up of defaults + options

    mergeOptions = function( defaults, options ) {
        var settings = {}
        for ( name in defaults ) {
            settings[ name ] = defaults[ name ];
        }
        for ( name in options ) {
            settings[ name ] = options[ name ];
        }
        return settings;
    }

    this.options = options;
    this.defaults = defaults;
    if( ! this.settings ) { this.settings = {}; }
    return this.settings;
}

function settingsTest( ) 
// [14-09-11 19:24:11:851 ART] defaults, options, settings: 
// [14-09-11 19:24:11:852 ART] {b=2.0, c=3.0, a=1.0}
// [14-09-11 19:24:11:852 ART] {d=100.0, a=99.0}
// [14-09-11 19:24:11:852 ART] {d=100.0, b=2.0, c=3.0, a=99.0}
{
    defaults = { a: 1, b:2, c:3 };
    options = { a: 99, d: 100 };
    config = new Settings( defaults, options );
    Logger.log ( 'defaults, options, settings: ' );
    Logger.log ( config.defaults );
    Logger.log ( config.options );
    Logger.log ( config.settings );
}

