 /*
 Comments on the GloberSuggestionsLib code:

 There is too much programmatic complexity, not proportional to the dimensions
 of the work itself (300 tickets times 3000 globers approx). 

 Normalise.gs
 Albeit the name calls for a general normalisation set of functions, it's only
 an overly complex locations management set of functions. 
 IMO this is to be replaced by a manually filled square table telling if two
 locations are very compatible (AR/NP & AR/SP), semi compatible (AR/Tandil &
 AR/BsAs) or not compatible (AR & BR).
 We can use another 2-dimensions table containing the penalization value for
 each locations pair.
 Also, we could use another map to enter any location, including rogue values,
 and get back a normalised location.

 Prototypes.gs
 Leave as is, except for a correction in the handling of the way the ToString
 functions are added: it's done replacing the constructor's prototype in full,
 and should be added eventually replacing each single function. 
 Surprisingly, the right form does not compile, commented out for now.
 This code can be used without needing to look at it, because it's quite
 obvious. 
 To make it more useful I'd add the jsdoc to the constructors. This way, the
 autocomplete will show the arguments whenever they are mentioned in the editor.

 Rules.gs
 Contains the functions that calculate the different penalization values, given
 a glober and a ticket. 
 This approach is OK, except that the code should be reduced to about 1/3 of its
 current size, by making it simpler.

 Library.MappingsDataset.gs
 Use a table. Given a conventional "file" name, return a reference to a sheet
 located anywhere. 
 For new releases or testing, just point the programs to a different table and
 done. 
 The performance impach is negligible, because all the files are usually
 referenced when the program starts. Results could be cached if needed. 

 CCPOErrorListClass.gs
 Make it return true if errors were reported, else false. 











*/
