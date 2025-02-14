module.exports = {
    moduleFileExtensions: [
        "js",
        "jsx",
        "json",
        "ts",
        "vue"
    ],
    transform: {
        "^.+\\.vue$": "vue-jest",
        ".+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$": "jest-transform-stub",
        "^.+\\.jsx?$": "babel-jest",
        "\\.js$": ["babel-jest", {
            configFile: "./babel-jest.config.js"
        }],
        '^.+\\.ts?$': "ts-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    snapshotSerializers: [
        "jest-serializer-vue"
    ],
    testMatch: [
        "**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)"
    ],
    testURL: "http://localhost/",
    globals: {
        "ts-jest": {
            isolatedModules: true,
        },
    }
};
