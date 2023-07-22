import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import { run } from "./runtime.js";
import { error } from "./error.js";

 export function marl(input,outFun=false,id=false) {
  try {
   run(parse(lex(input)),outFun,id).catch(err => {error(err, input, outFun,id);});
  } catch (err) {
    error(err, input, outFun,id);
  }
}

marl(`import str
print( "this".str_startsWith("th") )
print( "this".str_endsWith("f") )
print( "this".str_indexOf("i") )
print( "this".str_indexOf("u") )
`)