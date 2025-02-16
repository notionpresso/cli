#!/usr/bin/env node

import { Command } from "commander";
import { Client } from "@cozy-blog/notion-client";
import { extractPageIdFromUrl } from "./page-id-extractor";
import * as path from "path";
import { fetchAndSavePageData } from "./dump-page";
import typia from "typia";

const DEFAULT_OUTPUT_DIR = "notion-data";
const DEFAULT_IMAGE_OUT_DIR = "public/notion-data";

interface CLIOptions {
  page: string;
  auth: string;
  dir?: string;
  imageDir?: string;
}

const program = new Command();

program
  .name('npresso')
  .description('CLI tool for downloading Notion pages and their assets')
  .version('0.0.2')
  
program
  .requiredOption(
    '--page <pageUrl>', 
    'Notion page ID or URL (e.g., myblog/page-id-123 or just page-id-123). Note: You don\'t need to include "https://www.notion.so/"'
  )
  .requiredOption(
    '--auth <authToken>', 
    'Notion API integration token (See tutorial: https://notionpresso.com/en/tutorial, or create one at https://www.notion.so/my-integrations)'
  )
  .option(
    '--dir <dir>', 
    'Directory where the page content will be saved',
    'notion-data'
  )
  .option(
    '--image-dir <dir>',
    'Directory where the page images will be saved',
    'public/notion-data'
  )
  .addHelpText('after', `
Example:
  $ npresso --page myblog/page-id-123 --auth secret_token...
  $ npresso --page page-id-123 --auth secret_token... --dir custom-dir --image-dir images
  `);

program.parse(process.argv);

const options = program.opts();

if (!typia.is<CLIOptions>(options)) {
  console.error("Invalid options", options);
  process.exit(1);
}

const pageId = extractPageIdFromUrl(options.page);

const outputDir = path.join(process.cwd(), options.dir || DEFAULT_OUTPUT_DIR);

const imageOutDir = path.join(
  process.cwd(),
  options.imageDir || DEFAULT_IMAGE_OUT_DIR,
  pageId,
);

const client = new Client({ auth: options.auth });

/**
 * fetch and save page data
 */
(async () => {
  try {
    await fetchAndSavePageData({ client, pageId, outputDir, imageOutDir });
  } catch (error: any) {
    console.error("Error fetching page data:", error.message);
    process.exit(1);
  }
})();