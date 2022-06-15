import jsonfile from "jsonfile";

const defaultConfig = {
	//* Campaign property is immutable once deployed
	campaign: {
		events: [
			{
				strategy: "flat",
				rate: 0.1,
				limit: 1000000
			}
		],
		reward: {
			limit: 100
		}
	},
	//* Details and Adveriser related data can be configured after the campaign is deployed.
	details: {
		destination_url: "https://usher.so/?ref=usher-partner",
		name: "This is my cool referral program",
		description:
			"Earn rewards when you refer users that register on our website!",
		image: "", // Internet accessible URL to a banner image relevant to this referral program. Image size should be landscape to size well.
		external_link: "https://usher.so" // Link to a web page that explains the referral program
	}
};

const createCampaign = async (name: string, dir: string) => {};

export default createCampaign;
