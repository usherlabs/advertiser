/**
 * Create a configuration to a
 * glaze model:add ar-network tile campaigns '{ "set": [] }' --schema=ceramic:// --key=
 */

import chalk from "chalk";
import mkdirp from "mkdirp";
import { Command, Option } from "commander";
import path from "path";
import createCampaign from "@/lib/campaign/create";
import updateCampaign from "@/lib/campaign/update";
import deployCampaign from "@/lib/campaign/deploy";
import startCampaign from "@/lib/campaign/start";
import CampaignDetailsSchema from "@/schema/CampaignDetails.json";

const cmd = new Command();

cmd
	.name("campaign")
	.description("Manage your Usher Advertiser Campaign directly from the CLI")
	.option(
		"-k, --key",
		`Arweave Private Key (JWK). Used for authenticated ${chalk.yellow(
			"update"
		)}s, for ${chalk.yellow("deploy")}ments and to ${chalk.yellow(
			"start"
		)} managing payouts for a campaign`
	);

const createCmd = new Command();

createCmd
	.name("create")
	.description("Create a new configuration for an Arweave Advertiser Campaign")
	.argument("<name>", "Name of the Campaign.")
	.option(
		"-d, --directory",
		"The directory that you would like to create the campaign in."
	)
	.action(async (args, options) => {
		const dir = path.resolve(process.cwd(), options.directory || ".");
		if (options.directory) {
			await mkdirp(dir);
		}
		await createCampaign(args.name, dir);
		console.log(chalk.green(`Campaign ${args.name} files created at ${dir}.`));
		console.log(`Configure these files before deploying.`);
	});

const updateCmd = new Command();

updateCmd
	.name("update")
	.description("Update ONLY the details of a deployed Campaign")
	.argument("<address>", "Blockchain Address of the Campaign.")
	.action(async (args, { key, ...options }) => {
		await updateCampaign(key, args.address, options);
		console.log(chalk.green(`Campaign ${args.address} has been updated.`));
	});

Object.entries<{ description: string }>(
	CampaignDetailsSchema.properties
).forEach(([key, value]) => {
	const opt = new Option(`--${key}`, value.description || "");
	updateCmd.addOption(opt);
});

const deployCmd = new Command();

deployCmd
	.name("deploy")
	.description("Deployed the Campaign using the configuration files")
	.argument("<name>", "Name of the Campaign.")
	.option(
		"-d, --directory",
		"The directory that you would like to create the campaign in."
	)
	.action(async (args, { key, ...options }) => {
		const dir = path.resolve(process.cwd(), options.directory || ".");
		const tx = await deployCampaign(key, args.name, dir);
		console.log(
			chalk.green(`Campaign ${args.name} has been deployed to address ${tx}.`)
		);
		console.log(
			`You can visit https://arweave.net/${tx} to see the campaign terms.`
		);
		console.log(
			chalk.cyan(
				`Submit the Campaign address ${tx} to Usher by visiting https://go.usher.so/start-a-campaign`
			)
		);
	});

const startCmd = new Command();

startCmd
	.name("start")
	.description(
		"Start the payout management node for the Arweave Advertiser Campaign"
	)
	.argument("<address>", "Blockchain Address of the Campaign.")
	.action(async (args, { key }) => {
		await startCampaign(key, args.address);
	});

cmd.addCommand(createCmd);
cmd.addCommand(updateCmd);
cmd.addCommand(deployCmd);
cmd.addCommand(startCmd);

export default cmd;
