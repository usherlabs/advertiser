import { JWKInterface } from "arweave/node/lib/wallet";
import ono from "@jsdevtools/ono";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import chalk from "chalk";

import { CERAMIC_AR_REWARDS_STREAM_ID } from "@/constants";
import getArweaveClient from "@/utils/arweave-client";
import { Campaign } from "@/types";
import Authenticate from "@/utils/authenticate";

const arweave = getArweaveClient();
const authInstance = Authenticate.getInstance();
let intervalInstance: NodeJS.Timer;

const stop = () => {
	clearInterval(intervalInstance);
};

const start = (fn: () => Promise<void>, interval: number) => {
	intervalInstance = setInterval(() => {
		fn().catch((e) => {
			console.log(
				chalk.red(`An error has occurred, but we persist until you cancel.`)
			);
			console.error(e);
		});
	}, interval);
};

process.stdin.resume(); // so the program will not close instantly

function exitHandler(
	options: { exit: boolean },
	exitCode: number | null | undefined
) {
	stop();
	if (exitCode || exitCode === 0) {
		console.log(exitCode);
	}
	if (options.exit) {
		process.exit();
	}
}

// do something when app is closing
// process.on("exit", exitHandler.bind(null, { cleanup: true }));
// catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
// catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

/**
 * Start the Campaign Payout Management Service
 *
 * Arweave ONLY
 *
 * @param   {JWKInterface}  key      [key description]
 * @param   {string}        address  [address description]
 */
const startCampaign = async (
	key: JWKInterface,
	address: string,
	options: { interval?: number }
) => {
	const campaignData = await arweave.transactions.getData(address, {
		decode: true,
		string: true
	});
	const campaign = JSON.parse(campaignData as string) as Campaign;
	const detailsStreamId = campaign.details as string;

	if (!detailsStreamId) {
		throw ono("Campaign is malformed. No details stream exists.", address);
	}

	const walletAddress = await arweave.wallets.jwkToAddress(key);
	await authInstance.withArweave(
		walletAddress,
		Authenticate.nativeArweaveProvider(key)
	);

	const interval = options.interval || 5 * 60 * 1000;

	start(async () => {}, interval);
};

export default startCampaign;
