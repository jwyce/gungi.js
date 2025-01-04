/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig } */
const config = {
  useTabs: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "es5",
  printWidth: 80,
  importOrder: [
    "<THIRD_PARTY_MODULES>",
    "<TYPES>",
    "<TYPES>^[.]",
    "^types$",
    "^@/types/(.*)$",
    "^@/utils/(.*)$",
    "^@/lib/(.*)$",
    "^[./]",
  ],

  importOrderParserPlugins: ["typescript", "decorators-legacy"],
  plugins: [ "@ianvs/prettier-plugin-sort-imports", ],
};

export default config;
