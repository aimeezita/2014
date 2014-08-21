// collect static function cross references
// works with all the sources pasted into a single file, commiting and
// starting to work on a version that processes multiple files in a
// single directory
  console.log( 'jsxref: static functions cross reference ' + new Date() );
  var 
    esprima = require('esprima'),
    fs = require('fs'),
    path = require('path'),
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

  // processes one source file
  var fileUsage = ''; // looking the definitions, or for references
  function doOneFile( sourceFileName, visitor ) {
    // isolate the file name
    sourceBaseName = path.basename(sourceFileName, '.gs');

    // read the source in memory
    console.log( '\n' + fileUsage + sourceBaseName );
    var sourceText = fs.readFileSync( sourceFileName, 'utf8'); 

    // parse the source into an object
    var syntaxTree = esprima.parse( sourceText, { tolerant: true, loc: true, comment: false });
    if( sourceBaseName === 'ZZZModule_ComputeDispersion' ) {
      console.log( JSON.stringify( syntaxTree, null, '  ' ));
    }

    // collect the functions data
    traverse( syntaxTree, visitor );
  }

  // variable defs for the visitor functions
  var
    sourceBaseName = '',      // name of the current source file
    functionDefs = {},        // list of function definitions, key is function name
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
            functionDef.sourceFile = sourceBaseName;
            functionDef.type = node.id.type;
            functionDef.name = node.id.name;
            functionDef.loc = node.id.loc;

            // prevent repteated function numbers, attach a number to 2nd+ instances
            var functionNameNumber;
            functionNameNumber = 0;
            var functionNameNumbered = functionDef.name; // initially no number attached
            while( functionDefs[functionNameNumbered] ) {
              functionNameNumber++;
              functionNameNumbered =  functionDef.name + '_' + (functionNameNumber + 1);
            }
            // insert in function definitions list
            functionDefs[functionNameNumbered] = functionDef;
            console.log( '  ' + functionDef.sourceFile + ' ' + functionDef.loc.start.line + ' ' + functionNameNumbered 
            + ( (functionNameNumber == 0) ? ' ' : '  REPEATED FUNCTION NAME' ));
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
            var referencedFunction = functionDefs[node.callee.name];
            if( referencedFunction ) {
              // console.log( JSON.stringify( referencedFunction ));
              functionRef = {};
              functionRef.sourceFile = sourceBaseName;
              functionRef.type = node.callee.type;
              functionRef.name = node.callee.name;
              functionRef.loc = node.callee.loc;
              functionReferences.push( functionRef );
              console.log( '  ' + functionRef.sourceFile + ' ' + functionRef.loc.start.line + ' '
              + referencedFunction.sourceFile + '.' + referencedFunction.name);
            }
          }
        }
      }
    }
  };

  // enumerate the function definitions
  var i;
  console.log( '\n\n\nFinding function definitions' );
  fileUsage = 'functions defined in ';
  traverseCalls = 0;
  for( i = 2; i < process.argv.length; i++ ) { 
    doOneFile( process.argv[i], visitor1 );
  }
  console.log( '\nvisits: ' + traverseCalls + ' function definitions: ' + Object.keys(functionDefs).length );

  // find the function references
  console.log( '\n\n\nFinding function references' );
  fileUsage = 'functions referenced by ';
  traverseCalls = 0;
  for( i = 2; i < process.argv.length; i++ ) { 
    doOneFile( process.argv[i], visitor2 );
  }
  console.log( '\nvisits: ' + traverseCalls + ' function references: ' + functionReferences.length );

