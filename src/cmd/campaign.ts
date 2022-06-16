/**
 * Create a configuration to a
 * glaze model:add ar-network tile campaigns '{ "set": [] }' --schema=ceramic:// --key=
 */

import chalk from "chalk";
import mkdirp from "mkdirp";
import { Command, Option } from "commander";
import path from "path";
import jsonfile from "jsonfile";

import createCampaign from "@/lib/campaign/create";
import updateCampaign from "@/lib/campaign/update";
import deployCampaign from "@/lib/campaign/deploy";
import startCampaign from "@/lib/campaign/start";
import CampaignDetailsSchema from "@/schema/CampaignDetails.json";

const keyOption = [
	"-k, --key <string>",
	`Arweave Private Key (JWK). Used for authenticated ${chalk.yellow(
		"update"
	)}s, for ${chalk.yellow("deploy")}ments and to ${chalk.yellow(
		"start"
	)} managing payouts for a campaign`
];

const cmd = new Command();

cmd
	.name("campaign")
	.description("Manage your Usher Advertiser Campaign directly from the CLI");

const createCmd = new Command();

createCmd
	.name("create")
	.description("Create a new configuration for an Arweave Advertiser Campaign")
	.argument("<name>", "Name of the Campaign.")
	.option(
		"-d, --directory <string>",
		"The directory that you would like to create the campaign in."
	)
	.action(async (name, options) => {
		const dir = path.resolve(process.cwd(), options.directory || ".");
		if (options.directory) {
			await mkdirp(dir);
		}
		await createCampaign(name, dir);
		console.log(chalk.green(`Campaign ${name} created at ${dir} !`));
		console.log(`Configure this file before deploying...`);
	});

const deployCmd = new Command();

deployCmd
	.name("deploy")
	.description("Deployed the Campaign using the configuration files")
	.argument("<campaign>", "Path to Campaign file.")
	.argument("<profile>", "Path to Profile file.")
	.requiredOption(keyOption[0], keyOption[1])
	.action(async (campaignPath, profilePath, { key }) => {
		const campaignConfig = await jsonfile.readFile(campaignPath);
		const profileConfig = await jsonfile.readFile(profilePath);
		const jwk = JSON.parse(key);
		const tx = await deployCampaign(jwk, campaignConfig, profileConfig);
		console.log(
			chalk.green(
				`Campaign ${path.basename(campaignPath)} with Profile ${path.basename(
					profilePath
				)} has been deployed to address ${tx.id}!`
			)
		);
		console.log(
			`You can visit https://arweave.net/${tx.id} to see the campaign terms.`
		);
		console.log(
			chalk.cyan(
				`Submit the Campaign address ${tx.id} to Usher by visiting https://go.usher.so/start-a-campaign`
			)
		);
	});

const updateCmd = new Command();

updateCmd
	.name("update")
	.description("Update ONLY the details of a deployed Campaign")
	.argument("<address>", "Blockchain Address of the Campaign.")
	.requiredOption(keyOption[0], keyOption[1])
	.action(async (address, { key, ...options }) => {
		await updateCampaign(key, address, options);
		console.log(chalk.green(`Campaign ${address} has been updated.`));
	});

Object.entries<{ description: string }>(
	CampaignDetailsSchema.properties
).forEach(([key, value]) => {
	const opt = new Option(`--${key}`, value.description || "");
	updateCmd.addOption(opt);
});

const startCmd = new Command();

startCmd
	.name("start")
	.description(
		"Start the payout management node for the Arweave Advertiser Campaign"
	)
	.argument("<address>", "Blockchain Address of the Campaign.")
	.requiredOption(keyOption[0], keyOption[1])
	.option(
		"-i, --interval <number>",
		"An interval in SECONDS for how often to check for new reward claims"
	)
	.action(async (address, { key, ...options }) => {
		await startCampaign(key, address, options);
	});

cmd.addCommand(createCmd);
cmd.addCommand(updateCmd);
cmd.addCommand(deployCmd);
cmd.addCommand(startCmd);

export default cmd;
