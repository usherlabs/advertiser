/**
 * Create a configuration to a
 * glaze model:add ar-network tile campaigns '{ "set": [] }' --schema=ceramic:// --key=
 */

import chalk from "chalk";
import mkdirp from "mkdirp";
import { Command } from "commander";
import path from "path";
// import { DataModel } from "@glazed/datamodel";
// import AdvertiserModel from "../models/Advertiser.json";
import { getCeramic } from "../utils/manager";

// const getDoc = async () => {
// 	const ceramic = await getCeramic();
// 	const model = new DataModel({ ceramic, aliases: AdvertiserModel });
// 	const doc = await model.loadTile("ar_campaigns");
// 	if (!doc) {
// 		console.log(chalk.red(`Cannot load the Usher Advertiser Stream!`));
// 		process.exit(1);
// 	}
// 	return doc;
// };

const defaultConfig = {
	//* Campaign property is immutable once deployed
	campaign: {
		events: [
			{
				strategy: "flat",
				rate: 0.1
			}
		]
	},
	//* Details and Adveriser related data can be configured after the campaign is deployed.
	details: {
		destination_url: "https://usher.so/?ref=usher-partner",
		name: "This is my cool referral program",
		description:
			"Earn rewards when you refer users that register on our website!",
		image: "", // Internet accessible URL to an image relevant to this referral program
		external_link: "https://usher.so" // Link to a web page that explains the referral program
	}
};

const cmd = new Command();

cmd
	.name("create")
	.description("Create a new configuration for the Arweave Advertiser Campaign")
	.argument("<string>", "Name of the Campaign.")
	.option(
		"-d, --directory",
		"The directory that you would like to create the campaign in."
	)
	.action(async (args, options) => {
		const dir = path.resolve(process.cwd(), options.directory || ".");
		if (options.directory) {
			await mkdirp(dir);
		}
	});

export default cmd;
