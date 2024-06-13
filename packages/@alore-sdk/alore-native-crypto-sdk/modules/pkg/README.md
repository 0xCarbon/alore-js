# DKLs23-wasm

Wasm bindings for [DKLs23](https://github.com/0xCarbon/DKLs23).

## Instructions for running locally

### How to compile to web

1. Compile the library using wasm:

```bash
wasm-pack build --target web
```

This command will generate a `pkg` folder in the root of the project.

2. Enter the `pkg` folder and generate a symbolic link:

```bash
cd pkg && yarn link
```

This command will make a `dkls23-wasm` package available to use.

### Example usage in a web project

1. In a web project where you want to use the `dkls23-wasm` package, bind the the symbolic link to the project:

```bash
yarn link "dkls23-wasm"
```

This command will add the `dkls23-wasm` package to the project `node_modules`.

2. Initialize the wasm module and make use of the package:

```bash
import init, { greet } from 'dkls23-wasm';

init().then(() => {
    greet();
});
```

## Instructions for making a new release

1. Compile the package:

```bash
wasm-pack build --target web --scope 0xCarbon
```

2. Update the package.json version, repository and publishConfig. It should look something like this:

```package.json
{
  "name": "@0xCarbon/dkls23-wasm",
  "version": "0.1.0",
  "repository": "https://github.com/0xCarbon/dkls23-wasm",
  "files": [
    "dkls23_wasm_bg.wasm",
    "dkls23_wasm.js",
    "dkls23_wasm.d.ts"
  ],
  "module": "dkls23_wasm.js",
  "types": "dkls23_wasm.d.ts",
  "sideEffects": false,
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

3. Login to npm github registry:

```bash
npm login --scope=@0xcarbon --registry=https://npm.pkg.github.com
```

4. Enter the `pkg` folder and publish a new release:

```bash
cd pkg && npm publish --access restricted
```
