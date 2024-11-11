const react = require('eslint-plugin-react');

module.exports = [
    {
        plugins: {
            react,
        },
        rules: {
            semi: "error",
            "prefer-const": "error"
        }
    }
];