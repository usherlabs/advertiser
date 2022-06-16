import { TileDocument } from "@ceramicnetwork/stream-tile";
import { JWKInterface } from "arweave/node/lib/wallet";
import ono from "@jsdevtools/ono";
import { Validator } from "jsonschema";

import { CampaignDetails, Campaign } from "@/types";
import getArweaveClient from "@/utils/arweave-client";
import Authenticate from "@/utils/authenticate";
import CampaignDetailsSchema from "@/schema/CampaignDetails.json";

const arweave = getArweaveClient();
const authInstance = Authenticate.getInstance();
const schemaValidator = new Validator();

/**
 * Update the CampaignDetails using the Arweave Transaction
 * Updated fields will be merged into the existing CampaignDetails
 *
 * 1. Pull the CampaignDetails stream
 * 2. Authenticate with 3DID
 * 3. Pass the updated config to the stream
 *
 * @param   {JWKInterface}  key      Arweave Private Key / JWK
 * @param   {string}        address  Campaign Blockchain Address
 * @param   {CampaignDetails}        config   Updated configuration
 *
 * @return  {CampaignDetails}                 New CampaignDetails
 */
const updateCampaign = async (
	key: JWKInterface,
	address: string,
	config: CampaignDetails
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
	const detailsValidationResult = schemaValidator.validate(
		config,
		CampaignDetailsSchema
	);
	if (detailsValidationResult.errors.length > 0) {
		throw ono("Campaign Details failed to validate", detailsValidationResult);
	}

	const walletAddress = await arweave.wallets.jwkToAddress(key);
	await authInstance.withArweave(
		walletAddress,
		Authenticate.nativeArweaveProvider(key)
	);

	const doc = await TileDocument.load(
		authInstance.getCeramic(),
		detailsStreamId
	);
	const newDetails = {
		...(doc.content as CampaignDetails),
		...config
	};

	await doc.update(newDetails);

	return newDetails;
};

export default updateCampaign;
