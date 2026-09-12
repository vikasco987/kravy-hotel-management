import { getAuthContext } from './src/lib/authContext.js';

async function main() {
  try {
    console.log("Testing Prisma auth context...");
    const ctx = await getAuthContext();
    console.log("Success:", ctx);
  } catch (e) {
    console.error("Error occurred:");
    console.error(e);
  }
}

main();
