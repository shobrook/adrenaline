import mixpanel from 'mixpanel-browser';

// const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN 
const MIXPANEL_TOKEN = "9c022fdde3d5b1415b9ddda36a8b19bd";
mixpanel.init(MIXPANEL_TOKEN, { debug: true, ignore_dnt: true, api_host: "https://api.mixpanel.com" });

// TODO: Setup environments (prod v. dev)
// let env_check = process.env.NODE_ENV === 'production';

let actions = {
	identify: (id) => {
		mixpanel.identify(id);
	},
	alias: (id) => {
		mixpanel.alias(id);
	},
	track: (name, props) => {
		mixpanel.track(name, props);
	},
	people: {
		set: (props) => {
			mixpanel.people.set(props);
		},
		increment: (prop, inc) => {
			mixpanel.people.increment(prop, inc)
		}
	}
};

export let Mixpanel = actions;