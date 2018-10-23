# babel-plugin-typescript-to-proptypes

[![Build Status](https://travis-ci.org/milesj/babel-plugin-typescript-to-proptypes.svg?branch=master)](https://travis-ci.org/milesj/babel-plugin-typescript-to-proptypes)

A Babel plugin to generate React PropTypes from TypeScript interfaces or type aliases.

> Does not support converting external type references (as Babel has no type information) without
> the `typeCheck` option being enabled.

## Examples

Supports class components that define generic props.

```js
// Before
import React from 'react';

interface Props {
  name?: string;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';

class Example extends React.Component {
  static propTypes = {
    name: PropTypes.string,
  };

  render() {
    return <div />;
  }
}
```

Stateless function components that annotate the props argument.

```js
// Before
import React from 'react';

interface Props {
  name: string;
}

function Example(props: Props) {
  return <div />;
}

// After
import React from 'react';
import PropTypes from 'prop-types';

function Example(props) {
  return <div />;
}

Example.propTypes = {
  name: PropTypes.string.isRequired,
};
```

And anonymous functions that are annotated as a `React.SFC`.

```js
// Before
import React from 'react';

type Props = {
  name?: string,
};

const Example: React.SFC<Props> = props => <div />;

// After
import React from 'react';
import PropTypes from 'prop-types';

const Example = props => <div />;

Example.propTypes = {
  name: PropTypes.string,
};
```

## Requirements

- Babel 7+
- TypeScript 2+

## Installation

```js
yarn add --dev babel-plugin-typescript-to-proptypes
// Or
npm install --save-dev babel-plugin-typescript-to-proptypes
```

## Usage

Add the plugin to your Babel config. It's preferred to enable this plugin for development only, or
when building a library.

```js
// babel.config.js
const plugins = [];

if (process.env.NODE_ENV !== 'production') {
  plugins.push('babel-plugin-typescript-to-proptypes');
}

module.exports = {
  // Required
  presets: ['@babel/preset-typescript', '@babel/preset-react']
  plugins,
};
```

When transpiling down to ES5 or lower, the `@babel/plugin-proposal-class-properties` plugin is
required.

### Options

- `customPropTypeSuffixes` (string[]) - Reference custom types directly when they match one of the
  provided suffixes. This option requires the type to be within the file itself, as imported types
  would be automatically removed by Babel. Defaults to `[]`.

```js
module.exports = {
  plugins: [['babel-plugin-typescript-to-proptypes', { customPropTypeSuffixes: ['Shape'] }]],
};
```

```js
// Before
import React from 'react';
import PropTypes from 'prop-types';
import { NameShape } from './shapes';

interface Props {
  name?: NameShape;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';
import { NameShape } from './shapes';

class Example extends React.Component {
  static propTypes = {
    name: NameShape,
  };

  render() {
    return <div />;
  }
}
```

- `forbidExtraProps` (boolean) - Automatically wrap all `propTypes` expressions with
  [airbnb-prop-types](https://github.com/airbnb/prop-types) `forbidExtraProps`, which will error for
  any unknown and unspecified prop. Defaults to `false`.

```js
module.exports = {
  plugins: [['babel-plugin-typescript-to-proptypes', { forbidExtraProps: true }]],
};
```

```js
// Before
import React from 'react';

interface Props {
  name?: string;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from 'airbnb-prop-types';

class Example extends React.Component {
  static propTypes = forbidExtraProps({
    name: PropTypes.string,
  });

  render() {
    return <div />;
  }
}
```

- `typeCheck` (boolean|string) - Resolve full type information for aliases and references using
  TypeScript's built-in type checker. When enabled with `true`, will glob for files using
  `./src/**/*.ts`. Glob can be customized by passing a string. Defaults to `false`.

> Note: This process is heavy and may increase compilation times.

```js
module.exports = {
  plugins: [['babel-plugin-typescript-to-proptypes', { typeCheck: true }]],
};
```

```js
// Before
import React from 'react';
import PropTypes from 'prop-types';
import { Location } from './types';

interface Props {
  location?: Location;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';

class Example extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      lat: PropTypes.number,
      long: PropTypes.number,
    }),
  };

  render() {
    return <div />;
  }
}
```
