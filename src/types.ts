import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { ModelTypeAliases } from "@glazed/types";

/**
 * ###### ENUMS ######
 */

export enum Chains {
	ARWEAVE = "arweave",
	ETHEREUM = "ethereum"
	// POLYGON = "polygon"
}

export enum CampaignConflictStrategy {
	OVERWRITE = "overwrite",
	PASSTHROUGH = "passthrough"
}

export enum CampaignStrategies {
	FLAT = "flat",
	PERCENTAGE = "percentage"
}

/**
 * ###### TYPES ######
 */

export type Advertiser = {
	name?: string;
	icon?: string;
	description?: string;
	externalLink?: string;
	twitter?: string;
};

export type CampaignDetails = {
	destinationUrl: string;
	name: string;
	description?: string;
	image?: string;
	externalLink?: string;
};

export type CampaignTerms = {
	events: {
		strategy: CampaignStrategies;
		rate: number;
		limit?: number;
	}[];
	reward: {
		address?: string; // Left empty to use Chain's native token
		limit?: number;
	};
	conflictStrategy?: CampaignConflictStrategy;
};

export type Campaign = CampaignTerms & {
	details: CampaignDetails | string;
	advertiser: Advertiser | string;
};

/**
 * ###### INTERFACES ######
 */

export interface IDIDDataStore
	extends DIDDataStore<
		ModelTypeAliases<
			Record<string, any>,
			Record<string, string>,
			Record<string, string>
		>,
		string
	> {}
export interface IDataModel
	extends DataModel<
		ModelTypeAliases<
			Record<string, any>,
			Record<string, string>,
			Record<string, string>
		>,
		any
	> {}
