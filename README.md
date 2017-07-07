# webrx-react Framework

> This project is not stable and is in development. If you'd like to contribute, please submit a Pull Request.

`webrx-react` is a reactive web UI framework written in [TypeScript](http://www.typescriptlang.org/) that leverages Observables from [RxJS 5](https://github.com/ReactiveX/rxjs), properties and commands from an internal lightweight port of [WebRx](https://github.com/WebRxJS/WebRx), performant rendering from [Facebook's React](https://github.com/facebook/react), and consistent styling from [Twitter's Bootstrap](https://github.com/twbs/bootstrap) (as well as [react-boostrap](https://github.com/react-bootstrap/react-bootstrap) to bridge the gap with React).

This framework can be imported into another TypeScript project (recommended approach), imported into a JavaScript project, or you can alternatively just choose to work directly on a fork of this repository.

`webrx-react` is designed to be a single page web app framework that uses observables to drive rendering of React components. This framework comes with a number of foundationary components that allow you to compose more complex but consistent looking web apps.

[![Build Status](https://img.shields.io/travis/marinels/webrx-react.svg?branch=develop)](https://travis-ci.org/marinels/webrx-react)
[![npm Version](https://img.shields.io/npm/v/webrx-react.svg)](https://www.npmjs.com/package/webrx-react)
[![npm Downloads](https://img.shields.io/npm/dt/webrx-react.svg)](https://www.npmjs.com/package/webrx-react)
[![npm License](https://img.shields.io/npm/l/webrx-react.svg)](https://www.npmjs.com/package/webrx-react)
[![Dependency Status](https://img.shields.io/versioneye/d/nodejs/webrx-react.svg)](https://www.versioneye.com/nodejs/webrx-react)
[![tslint](https://img.shields.io/badge/tslint-strict-117D6B.svg)](https://github.com/unional/tslint-config-unional/blob/master/style-strict.md)

## webrx-react Demo

View the [Demo](https://marinels.github.io/webrx-react/)

## Quick Start

This framework comes with a built-in demo that can be viewed in the browser. Simply run `npm install && npm run gulp` and browse to [http://localhost:3000/](http://localhost:3000/) to play around with the components built into this framework.

## Using `webrx-react`

To start building your own components using `webrx-react` framework, you may want to start by looking at the included foundationary components (and component demos). These components and demos offer the best hands on introduction to how everything works together.

### TypeScript

When using typescript to import this framework you can either import the whole API or individual modules.

Import the whole api by adding this line: `import * as wxr from 'webrx-react';`. Now you can access each namespace via the API surface using the `wxr` import alias (i.e., `new wxr.Components.BaseViewModel()`).

Import individual modules directly by supplying a path starting with `webrx-react/` (i.e. `import { BaseViewModel } from 'webrx-react/Components';`).

### JavaScript

_TBD_

## Development

If you are developing for `webrx-react`, the best strategy is to  run `npm run gulp watch` and use the browser to test out your changes.

You can also run `npm run gulp watch:mocha` if you are working on tests, or `npm run gulp watch:lint` if you want to fix linter errors.

You can additionally run `npm run gulp help` to list all of the available gulp commands and options.
