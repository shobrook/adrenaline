import mixpanel from 'mixpanel-browser';

const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT;
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_EXTENSION_MIXPANEL_TOKEN;
mixpanel.init(MIXPANEL_TOKEN, { debug: true, ignore_dnt: true, api_host: "https://api.mixpanel.com" });

let actions = {
	identify: (id) => {
		if (ENVIRONMENT === "production") {
			mixpanel.identify(id);
		}
	},
	alias: (id) => {
		if (ENVIRONMENT === "production") {
			mixpanel.alias(id);
		}
	},
	track: (name, props) => {
		if (ENVIRONMENT === "production") {
			mixpanel.track(name, props);
		}
	},
	people: {
		set: (props) => {
			if (ENVIRONMENT === "production") {
				mixpanel.people.set(props);
			}
		},
		increment: (prop, inc) => {
			if (ENVIRONMENT === "production") {
				mixpanel.people.increment(prop, inc);
			}
		}
	}
};

const Mixpanel = actions;
export default Mixpanel;