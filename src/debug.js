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

/** @ignore */
export const error = debug(ErrorKey);
/** @ignore */
export const info = debug(InfoKey);
/** @ignore */
export const warn = debug(WarningKey);


//-----------------------------------------------------------------------------------------------------------
// Functional flags
//-----------------------------------------------------------------------------------------------------------

/** @ignore */
export const AllKey = 'f.lux:*';

/** @ignore */
export const CollectionAllKey = 'f.lux:collection:*';
/** @ignore */
export const CollectionPropertyKey = 'f.lux:collection:property';
/** @ignore */
export const CollectionRestEndpointPropertyKey = 'f.lux:collection:restEnpointProperty';
/** @ignore */
export const CollectionPojoEndpointPropertyKey = 'f.lux:collection:pojoEnpointProperty';

/** @ignore */
export const ReferenceKey = 'f.lux:reference';
/** @ignore */
export const ShadowImplKey = 'f.lux:shadowImpl';
/** @ignore */
export const StoreKey = 'f.lux:store';
/** @ignore */
export const TransientKey = 'f.lux:transient';


// uncomment to turn on all postop-stores logging (or selectively using one of keys above)
//debug.enable(AllKey);


function debugoff() { }

/** @ignore */
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