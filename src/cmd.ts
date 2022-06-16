import { Command } from "commander";

import campaignsCmd from "@/cmd/campaign";

const program = new Command();

program.addCommand(campaignsCmd);

program.parse(process.argv);
