
# Nedis

  Nedis is a (partial) redis implementation written with node. Primarily for fun.

## Installation

     $ npm install nedis

## Trying It Out

 Since nedis implements the unified redis prototcol, we can use `redis-cli` with nedis! First start the server:

     $ nedis-server

 Now play with the cli:

     $ redis-cli 

     redis> hmset users:tj email tj@vision-media.ca age 23
     OK
     redis> hgetall users:tj
     1) "email"
     2) "tj@vision-media.ca"
     3) "age"
     4) "23"
     redis> keys users:*
     1) "users:tj"
     redis> 

## Running Tests

    $ make test

## License 

(The MIT License)

Copyright (c) 2011 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.