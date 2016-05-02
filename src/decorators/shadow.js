
import shadowPropertyHelper from "./shadowPropertyHelper";


/*
	A Property decorator for marking methods and properties (get/set) as being part of the shadow. 

	Example:

		@shadow
		get user() { 
			return { name: "Andy" } 
		}

		@shadow
		isAdmin() {
			return true;
		}

*/
export default function shadow(target, name, descriptor) {
	shadowPropertyHelper(target, name, descriptor);
}
