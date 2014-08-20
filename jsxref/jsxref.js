// collect static function cross references
// works with all the sources pasted into a single file, commiting and
// starting to work on a version that processes multiple files in a
// single directory
  var 
    esprima = require('esprima'),
    fs = require('fs'),
    traverseCalls = 0
  ;


  // recursively executes visitor on the syntax tree
  function traverse(object, visitor) {
    traverseCalls++;
    var key, child; 
    visitor.call(null, object);
    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key];
        if (typeof child === 'object' && child !== null) {
          traverse(child, visitor);
        }
      }
    }
  }

  // read the source in memory
  var sourceFileName = 'CCPO-20140814.js';
  var sourceText = fs.readFileSync( sourceFileName, 'utf8'); 

  // parse the source into an object
  var syntaxTree = esprima.parse( sourceText, { tolerant: true, loc: true, comment: true });
  console.log( JSON.stringify( syntaxTree, null, '  ' ));

  // variables using by the visitor functions
  var
    functionDefs = [],        // list of function definitions
    functionDefNames = [],    // only the function names of functionDefs[]
    functionDef = {},         // one function definition
    functionReferences = [],  // list of function references
    functionRef = {}          // one function reference
  ;
  
  var visitor1 = function(node) {
  // visitor #1: identify the function definitions, store them in functionDefs[]
  // "type": "FunctionDeclaration",
  // "id": {
  //   "type": "Identifier",
  //   "name": "copyColumns",
  //   "loc": {"start": {"line":240, "column":9 }, "end":{"line":240, "column":20}}
  // },
    if( node.type ) { 
      if( node.type === 'FunctionDeclaration' ) { 
        if( node.id ) {
          if( node.id.type === 'Identifier' ) {
            functionDef = {};
            functionDef.type = node.id.type;
            functionDef.name = node.id.name;
            functionDef.loc = node.id.loc;
            functionDefs.push( functionDef );
            functionDefNames.push( functionDef.name );
            console.log( JSON.stringify( functionDef ));
          }
        }
      }
    }
  };

  var visitor2 = function(node) {
  // visitor #2: find the function references, store them in functionDefs[]
  // "type": "CallExpression",
  // "callee": {
  //   "type": "Identifier",
  //   "name": "cloneObject",
  //   "loc":{"start":{"line":233, "column":17}, "end":{"line":233, "column":28}}
  // },
    if( node.type ) { 
      if( node.type === 'CallExpression' ) { 
        if( node.callee ) {
          if( node.callee.type === 'Identifier' ) {
            // only if it's one of the listed functions
            if( functionDefNames.indexOf( node.callee.name ) >= 0 ) {
              functionRef = {};
              functionRef.type = node.callee.type;
              functionRef.name = node.callee.name;
              functionRef.loc = node.callee.loc;
              functionReferences.push( functionRef );
              console.log( JSON.stringify( functionRef ));
            }
          }
        }
      }
    }
  };

  // enumerate the function definitions
  console.log( '\n\n\nFinding function definitions' );
  traverseCalls = 0;
  traverse( syntaxTree, visitor1 );
  console.log( '\nvisits: ' + traverseCalls + ' function definitions: ' + functionDefs.length );
  // find the function references
  console.log( '\n\n\nFinding function references' );
  traverseCalls = 0;
  traverse( syntaxTree, visitor2 );
  console.log( '\nvisits: ' + traverseCalls + ' function references: ' + functionReferences.length );

