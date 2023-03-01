import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN
mixpanel.init(MIXPANEL_TOKEN, {debug: true}); 

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
	},
};

export let Mixpanel = actions;