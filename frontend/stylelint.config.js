const directColorProperties = [
  "/(^|-)color$/",
  "background",
  "background-color",
  "background-image",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "fill",
  "stroke",
  "scrollbar-color",
];

const rawColorPatterns = [
  "/#[\\da-fA-F]{3,8}\\b/",
  "/rgba?\\(/i",
  "/hsla?\\(/i",
  "/\\b(?:white|black|red|green|blue|yellow|orange|purple|gray|grey)\\b/i",
];

const semanticColorValueOptions = {
  ignoreFunctions: false,
  ignoreValues: ["currentColor", "transparent", "none"],
  expandShorthand: false,
  recurseLonghand: false,
  message:
    "Use a semantic CSS variable for color-like value \"${value}\" in \"${property}\". Raw colors belong in frontend/src/style.css.",
};

export default {
  extends: ["stylelint-config-standard-vue"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "alpha-value-notation": null,
    "color-function-alias-notation": null,
    "color-function-notation": null,
    "color-hex-length": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "keyframes-name-pattern": null,
    "length-zero-no-unit": null,
    "media-feature-range-notation": null,
    "no-descending-specificity": null,
    "property-no-vendor-prefix": null,
    "rule-empty-line-before": null,
    "shorthand-property-no-redundant-values": null,
  },
  overrides: [
    {
      files: ["src/**/*.vue", "src/**/*.css"],
      rules: {
        "declaration-property-value-disallowed-list": {
          "/^border(?:-(?:top|right|bottom|left))?$/": rawColorPatterns,
          "box-shadow": rawColorPatterns,
          "text-shadow": rawColorPatterns,
          "filter": rawColorPatterns,
        },
        "scale-unlimited/declaration-strict-value": [
          directColorProperties,
          semanticColorValueOptions,
        ],
      },
    },
    {
      files: ["src/style.css"],
      rules: {
        "declaration-property-value-disallowed-list": null,
        "scale-unlimited/declaration-strict-value": null,
      },
    },
  ],
};
