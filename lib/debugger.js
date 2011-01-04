
/*!
 * Nedis - debugger
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

require.registerExtension('.js', function(js){
  return js.replace(/^ *\/\/debug: */gm, '');
});