import path from "path";
import jsonfile from "jsonfile";

const defaultCampaignTermsConfig = {
	//* Campaign terms are immutable once deployed
	terms: {
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
		image:
			"https://pages.usher.so/wp-content/uploads/2022/03/usher_alpha_pass_black.gif", // Internet accessible URL to a banner image relevant to this referral program. Image size should be landscape to size well.
		external_link: "https://usher.so" // Link to a web page that explains the referral program
	}
};

const createCampaign = async (name: string, dir: string) => {
	const filepath = path.resolve(dir, `${name}.json`);
	await jsonfile.writeFile(filepath, defaultCampaignTermsConfig);
};

export default createCampaign;
