import { isNative } from "akutils";


var debug = isNative() ?require("react-native-debug") :require("debug");

//debug.enable('f.lux:*');

//debug.enable('f.lux:collection');
//debug.enable('f.lux:store');


export default debug;