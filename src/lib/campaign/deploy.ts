import { JWKInterface } from "arweave/node/lib/wallet";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { Validator } from "jsonschema";
import ono from "@jsdevtools/ono";

import Authenticate from "@/utils/authenticate";
import { CampaignTerms, CampaignDetails, Advertiser } from "@/types";
import getArweaveClient from "@/utils/arweave-client";
import { CERAMIC_ADVERTISER_PROFILE_KEY } from "@/constants";
import AdvertiserProfileSchema from "@/schema/AdvertiserProfile.json";
import CampaignDetailsSchema from "@/schema/CampaignDetails.json";
import CampaignTermsSchema from "@/schema/CampaignTerms.json";

type CampaignConfig = {
	terms: CampaignTerms;
	details: CampaignDetails;
};

const authInstance = Authenticate.getInstance();
const arweave = getArweaveClient();
const schemaValidator = new Validator();

/**
 * 1. Authenticate with 3DID
 * 2. Create Profile in DIDDataStore
 * 3. Create a new CampaignDetails Tile
 * 4. Deploy the Terms with the associated Profile and CampaignDetails Tile Stream IDs
 *
 * @param   {JWKInterface}  jwk             Arweave Private Key / JWK
 * @param   {CampaignTerms}        campaignConfig  Campaign Terms & Details
 * @param   {Advertiser}        profileConfig   Advertiser Profile Configuration
 */
const deployCampaign = async (
	key: JWKInterface,
	campaignConfig: CampaignConfig,
	profileConfig: Advertiser
) => {
	const walletAddress = await arweave.wallets.jwkToAddress(key);
	const balanceWinston = await arweave.wallets.getBalance(walletAddress);
	const balanceAr = await arweave.ar.winstonToAr(balanceWinston);
	if (parseFloat(balanceAr) < 0.001) {
		throw new Error("Not enbough AR balance to deploy campaign");
	}
	await authInstance.withArweave(
		walletAddress,
		Authenticate.nativeArweaveProvider(key)
	);

	const profileValidationResult = schemaValidator.validate(
		profileConfig,
		AdvertiserProfileSchema
	);
	if (profileValidationResult.errors.length > 0) {
		throw ono("Advertiser Profile failed to validate", profileValidationResult);
	}
	const detailsValidationResult = schemaValidator.validate(
		campaignConfig.details,
		CampaignDetailsSchema
	);
	if (detailsValidationResult.errors.length > 0) {
		throw ono("Campaign Details failed to validate", detailsValidationResult);
	}
	const termsValidationResult = schemaValidator.validate(
		campaignConfig.terms,
		CampaignTermsSchema
	);
	if (termsValidationResult.errors.length > 0) {
		throw ono("Campaign Details failed to validate", termsValidationResult);
	}

	const store = authInstance.getStore();
	const existingProfile = await store.get(CERAMIC_ADVERTISER_PROFILE_KEY);
	if (existingProfile !== null) {
		profileConfig = {
			...existingProfile,
			...profileConfig
		};
	}
	// create/update the profile
	await store.set(CERAMIC_ADVERTISER_PROFILE_KEY, profileConfig);
	const profileDefId = store.getDefinitionID(CERAMIC_ADVERTISER_PROFILE_KEY);
	const profileStreamId = await store.getRecordID(profileDefId);

	// Create CampaignDetails
	const detailsSchema = authInstance.getModel().getSchemaURL("CampaignDetails");
	const detailsDoc = await TileDocument.create(
		authInstance.getCeramic(),
		campaignConfig.details,
		{ schema: detailsSchema || "" },
		{ pin: false }
	);
	const detailsStreamId = detailsDoc.id.toString();

	const campaign = {
		...campaignConfig.terms,
		details: detailsStreamId,
		advertiser: profileStreamId
	};

	const payload = JSON.stringify(campaign);

	const tx = await arweave.createTransaction(
		{
			data: payload
		},
		key
	);

	tx.addTag("Content-Type", "application/json");
	tx.addTag("Application", "Usher");
	tx.addTag("Client", "Usher Advertiser");

	await arweave.transactions.sign(tx, key);

	const response = await arweave.transactions.post(tx);

	if (response.status === 200) {
		await detailsDoc.update(detailsDoc.content, undefined, { pin: true });
	} else {
		throw ono(`Failed to post Arweave Transaction ${tx.id}`, response);
	}

	return tx;
};

export default deployCampaign;
