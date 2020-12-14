# hubot-vimexec

[![NPM Version][npm-image]][npm-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Test][test-ci-badge]][test-ci-action]
[![Lint][lint-ci-badge]][lint-ci-action]
[![Test Coverage][codecov-image]][codecov-url]


A hubot script that executes Vim.

See [`src/index.ts`](src/index.ts) for full documentation.


## Requirements

- Node.js v12.10.0+
- Docker
- `mkfifo(1)`


## Installation

In hubot project repo, run:

`npm install hubot-vimexec`

Then add **hubot-vimexec** to your `external-scripts.json`:

```json
[
  "hubot-vimexec"
]
```


## Usage

When you say a message starts with `:`, bot executes it as a Vim script.  And show the result.

```
user1>> :echo 'Hello, Vim!'
hubot>> Hello, Vim!
```

Multiline message can be accepttable.
`:` is needed for only first line.

```
user1>> :for i in range(3)
echo i
endfor
hubot>> 0
1
2
```

Vim process is keeping.

```
user1>> :let variable = 10
hubot>> done with no output: let variable = 10
user1>> :echo variable
hubot>> 10
```


## Customize

TODO (See header comment of [`src/index.ts`](src/index.ts))


## License

[zlib License](LICENSE.txt)


## Author

thinca <thinca+npm@gmail.com>


[npm-image]: https://img.shields.io/npm/v/hubot-vimexec.svg
[npm-url]: https://npmjs.org/package/hubot-vimexec
[node-version-image]: https://img.shields.io/node/v/hubot-vimexec.svg
[node-version-url]: https://nodejs.org/en/download/
[test-ci-badge]: ./../../workflows/Test/badge.svg
[test-ci-action]: ./../../actions?query=workflow%3ATest
[lint-ci-badge]: ./../../workflows/Lint/badge.svg
[lint-ci-action]: ./../../actions?query=workflow%3ALint
[codecov-image]: https://codecov.io/gh/thinca/hubot-vimexec/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/thinca/hubot-vimexec
