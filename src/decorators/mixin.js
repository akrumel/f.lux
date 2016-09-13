
import Property from "../Property";

/*
	Adds a mixin to a Property subclass. Mixins are a handy way to share life-cycle and shadow functionality
	across properties without using inheritance (which is fine too). A factory function is passed as the
	single parameter and returns a plain javascript object (https://lodash.com/docs#isPlainObject). The
	mixin object can have:
		* property lifecycle methods - these methods will be invoked before the property's implementation.
		* @shadow marked methods - these methods will be mapped onto the shadow after the actual property's
			shadow methods have been defined.
		* other methods - these will not be mapped onto the property or shadow so there is no chance of
			conflict with the property, shadow, or other mixins.

	A minimal mixin example:

		function mixinFactory(property) {
			// perform sub-property setup on the property (this example assumes KeyedProperty subclass)
			property.addPropertyClass(_connected, PrimitiveProperty, false, true);

			return {
				// lifecycle method
				propertyDidShadow() {
					console.log("Mixin propertyDidShadow() called");
				}

				// shadow method
				@shadow
				echo(msg) {
					console.log("Mixin echos: " + msg);
				}
			}
		}

	Use the mixin using the @mixin() decorator:

		@mixin(mixinFactory)
		class UsersCollection extends CollectionProperty { ... }

	Access the mixin shadow methods as normal:

		users.echo("Hello mixin");


	Parameter:
		mixinFactory - a function of the form: factory(property) : POJO
*/
export default function mixin(mixinFactory) {
	return function registerMixin(target, name, descriptor) {
		const p = Property;

		if (!Property.isPrototypeOf(target)) {
			throw new SyntaxError("@mixin() must be applied to a Property subclass.");
		}

		if (!target.mixins) {
			target.mixins = [];
		}

		target.mixins.push(mixinFactory);
	}
}
