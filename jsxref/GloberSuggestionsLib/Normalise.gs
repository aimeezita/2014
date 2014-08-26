// Locations normalisation
// replace with a manually filled square table telling if two locations
// are very compatible (AR/NP & AR/SP), semi compatible (AR/Tandil & AR/BSAs)
// or not compatible (AR & BR)
// Also, use another table to enter any location (including rogue values) and
// get back a normalised location


function NormalisedData(normalised, rejected) {
  this.normalised = normalised;
  this.rejected = rejected;
}

var NormaliseLocationProcess = function() {
  
  this._LOCATIONS_REJECTED = new Array();
  this._LOCATIONS_MAPPING = null;
  this._COMPATIBLE_LOCATIONS_CACHE = {};
  this._NORMALISE_LOCATIONS_CACHE = {};
  
  this.compatibleLocations = function(locations1, locations2) {
    
    var hashKey = locations1+"|"+locations2;
    var mirrorHashKey = locations2+"|"+locations1;
    
    if( this._COMPATIBLE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var match = this._compatibleLocations(locations1, locations2);
      this._COMPATIBLE_LOCATIONS_CACHE[hashKey] = match;
      this._COMPATIBLE_LOCATIONS_CACHE[mirrorHashKey] = match;
    }

    return this._COMPATIBLE_LOCATIONS_CACHE[hashKey];
  }
  
  
  this.getLocationsRejected = function() {
    return this._LOCATIONS_REJECTED;
  }
  
  
  this.normaliseLocation = function(location) {
    var hashKey = location;
    if( this._NORMALISE_LOCATIONS_CACHE[hashKey] == undefined ) {
      var normalised = this._normaliseLocation(location);
      this._NORMALISE_LOCATIONS_CACHE[hashKey] = normalised;
    }
    return this._NORMALISE_LOCATIONS_CACHE[hashKey];
  }
  
  this.locationIsAnywhere = function(location) {
    return this._prepareLocation(location) == "ANYWHERE";
  }

  /**********************************************************************************************************/
  this._compatibleLocations = function(locations1, locations2) {
    var normalisedLocation1Data = this._normaliseLocation(locations1);
    var normalisedLocation2Data = this._normaliseLocation(locations2);
    this._LOCATIONS_REJECTED = new Array();
    this._LOCATIONS_REJECTED.push.apply(normalisedLocation1Data.rejected, normalisedLocation2Data.rejected);
    var match = this._compatibleLocationArrays(normalisedLocation1Data.normalised, normalisedLocation2Data.normalised);
    return match;
  }

  this._prepareLocation = function(locationStr) {
    return locationStr.toLocaleUpperCase().trim();
  };

  this._setDefaultLocationsMapping = function() {
    this._LOCATIONS_MAPPING = getRows(getGlobersSuggestionsLocationsMappingSheet());
    for( var i = this._LOCATIONS_MAPPING.length-1; i >= 0; i-- ) {
      this._LOCATIONS_MAPPING[i]["Original"] = this._prepareLocation(this._LOCATIONS_MAPPING[i]["Original"]);
    }
  }

  this._compatibleLocationArrays = function(locationArray1, locationArray2) {
    if (!locationArray1) throw "Invalid LocationArray1: NULL";
    if (!locationArray2) throw "Invalid Locationarray2: NULL";
    for (i in locationArray1) {
      var location1 = locationArray1[i];
      for (j in locationArray2) {
        var location2 = locationArray2[j];
        if (!location1) throw "Invalid Location1: NULL";
        if (!location2) throw "Invalid Location2: NULL";
        if (location1 == "ANYWHERE") return true;
        if (location2 == "ANYWHERE") return true;
        if (location2 == location1) return true;
        if (location1.indexOf(location2) >= 0) return true;      
        if (location2.indexOf(location1) >= 0) return true;
      }
    }
    return false;
  }

  /**
   * Signature: NormalisedData normaliseLocation(String)
   */
  this._normaliseLocation = function(locationStr) {
    if( locationStr == null ) new NormalisedData([], []);
    var separator = ",";
    var locationsArray = null;
    var preparedLocationsArray = new Array();
    var mappedLocationsArray = new Array();
    var rejectedLocationsArray = new Array();
    
    // Change to uppercase and trim locations given first, to avoid calling this process repeated times
    if( locationStr.indexOf(separator) > 0 ) {
      locationsArray = locationStr.split(separator);
    } else {
      locationsArray = [ locationStr ];
    }
    for( var i = 0; i < locationsArray.length; i++ ) {
      preparedLocationsArray.push(this._prepareLocation(locationsArray[i]));
    }
    
    // Find location in mapping
    if( this._LOCATIONS_MAPPING == null ) {
      this._setDefaultLocationsMapping();
    }
    
    for( var i in preparedLocationsArray ) {
      var trimmedUCLocation = preparedLocationsArray[i];
      var match = false;
      for(var j=0; j < this._LOCATIONS_MAPPING.length; j++) {
        if( this._LOCATIONS_MAPPING[j]["Original"] == trimmedUCLocation ) {
          mappedLocationsArray.push(this._LOCATIONS_MAPPING[j]["Normalised"]);
          match = true;
          break;
        }
      }
      if( !match ) {
        rejectedLocationsArray.push(locationsArray[i]);
      }
    }
    return new NormalisedData(mappedLocationsArray, rejectedLocationsArray);
  }
}

function testCompatibleLocations() {
  var normalise = new NormaliseLocationProcess();
  assert(normalise.compatibleLocations("AR", "AR"), "Locations must be compatible: AR and AR");
  assert(normalise.compatibleLocations("AR", "AR/BsAs"), "Locations must be compatible: AR and AR/BsAs");
  assert(normalise.compatibleLocations("AR", "AR/Tandil"), "Locations must be compatible: AR and AR/Tandil");
  assert(normalise.compatibleLocations("AR/Tandil", "AR"), "Locations must be compatible: AR/Tandil and AR");
  assert(!normalise.compatibleLocations("AR/Cordoba", "AR/BsAs"), "Locations must not be compatible: AR/Cordoba and AR/BsAs");
  assert(!normalise.compatibleLocations("AR", "BR"), "Locations must not be compatible: AR and BR");
  var output = normalise._normaliseLocation("x");
  var rejecteds = output.rejected;
  for( var i = 0; i < rejecteds.length; i++ ) {
    log("Invalid location: " + rejecteds[i]);
  }
}

// NormaliseLocationProcess singleton
var normaliseLocationProcess = new NormaliseLocationProcess();

