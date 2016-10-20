import { isNative } from "akutils";


var debug = isNative() ?require("react-native-debug") :require("debug");

//-----------------------------------------------------------------------------------------------------------
// Debug level functions
//-----------------------------------------------------------------------------------------------------------

const ErrorKey = 'f.lux:error';
const InfoKey = 'f.lux:info';
const WarningKey = 'f.lux:warn';

if (process.env.NODE_ENV !== 'production') {
	// comment out one or more of following line to disable error/warning reporting
	debug.enable(ErrorKey);
	debug.enable(InfoKey);
	debug.enable(WarningKey);
}

export const error = debug(ErrorKey);
export const info = debug(InfoKey);
export const warn = debug(WarningKey);


//-----------------------------------------------------------------------------------------------------------
// Functional flags
//-----------------------------------------------------------------------------------------------------------

export const AllKey = 'f.lux:*';

export const CollectionAllKey = 'f.lux:collection:*';
export const CollectionPropertyKey = 'f.lux:collection:property';
export const CollectionRestEndpointPropertyKey = 'f.lux:collection:restEnpointProperty';

export const ShadowImplKey = 'f.lux:shadowImpl';
export const StoreKey = 'f.lux:store';
export const TransientKey = 'f.lux:transient';


// uncomment to turn on all postop-stores logging (or selectively using one of keys above)
//debug.enable(AllKey);


function debugoff() { }

export default function devDebug(modname) {
	if (process.env.NODE_ENV !== 'production') {
		let appDebug = debug(modname);

		return function appDebugFn(cb) {
			cb(appDebug);
		}
	} else {
		return debugoff;
	}
}