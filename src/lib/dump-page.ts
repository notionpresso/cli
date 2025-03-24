import Client, { bookmarkPreprocessors } from '@notionpresso/api-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { updateImageOnBlocks } from './download-image';

interface Meta {
  meta?: boolean;
  fields?: string[];
}

function removeOriginalBookmarkProperty(blocks: any[]): any[] {
  return blocks.map(block => {
    if (block.type === 'notionpresso_bookmark' && block.bookmark) {
      const { bookmark, ...rest } = block;
      return rest;
    }

    if (block.blocks?.length) {
      return {
        ...block,
        blocks: removeOriginalBookmarkProperty(block.blocks),
      };
    }

    return block;
  });
}

export async function fetchAndSavePageData({
  client,
  pageId,
  outputDir,
  imageOutDir,
  meta,
}: {
  client: Client;
  pageId: string;
  outputDir: string;
  imageOutDir: string;
  meta?: Meta;
}): Promise<void> {
  // Fetch full page data
  const fullPage = await client.fetchFullPage(pageId);

  if (meta?.meta) {
    console.log('Fetching bookmark metadata...');

    try {
      fullPage.blocks = await bookmarkPreprocessors.processBlocks(fullPage.blocks, {
        meta: meta.meta,
        fields: meta.fields,
      });

      fullPage.blocks = removeOriginalBookmarkProperty(fullPage.blocks);

      console.log('Bookmark metadata fetch completed');
    } catch (error) {
      console.error('Error transforming bookmarks:', (error as Error).message);
    }
  }

  // Create image directory
  fs.mkdirSync(imageOutDir, { recursive: true });

  await updateImageOnBlocks({
    blocks: fullPage.blocks,
    imageDir: imageOutDir,
    pageId, // pageId 전달
  });

  // Define the output file path
  const outputFile = path.join(outputDir, `${pageId}.json`);

  // Create the directory if it doesn't exist
  fs.mkdirSync(outputDir, { recursive: true });

  // Write the updated data to index.json (overwrite if it exists)
  fs.writeFileSync(outputFile, JSON.stringify(fullPage, null, 2), 'utf-8');

  console.log(`Page data saved to ${outputFile}`);
  console.log(`Images saved to ${imageOutDir}`);
}
