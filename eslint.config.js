const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks')

module.exports = [
    {
        plugins: {
            react,
            reactHooks,
        },
        rules: {
            semi: "error",
            "prefer-const": "error",
            "react-hooks/exhaustive-deps": "warn"
        }
    }
];