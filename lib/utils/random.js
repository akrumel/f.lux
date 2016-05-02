"use strict";

exports.__esModule = true;

exports.default = function () {
  var min = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
  var max = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  return Math.floor(Math.random() * (max - min + 1) + min);
};