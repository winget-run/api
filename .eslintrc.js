module.exports = {
  env: {
    es6: true,
    jest: true,
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "airbnb-base",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
  ],
  rules: {
    quotes: ["error", "double"],
    "import/extensions": "off",
    "no-console": "off",
    "arrow-parens": "off",
    "max-len": ["error", 150],
    "@typescript-eslint/interface-name-prefix": "off",
    // doesnt work with typescript stuff
    "no-undef": "off",
    "no-bitwise": "off",
    // working with mongo _ids
    "no-underscore-dangle": "off",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts"],
      },
    },
  },
};
