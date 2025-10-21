import { Hono } from "jsr:@hono/hono";
import { getDb } from "@utils/database.ts";
import { walk } from "jsr:@std/fs";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { toFileUrl } from "jsr:@std/path/to-file-url";

// Parse command-line arguments for port and base URL
const flags = parseArgs(Deno.args, {
  string: ["port", "baseUrl"],
  default: {
    port: "8000",
    baseUrl: "/api",
  },
});

const PORT = parseInt(flags.port, 10);
const BASE_URL = flags.baseUrl;
const CONCEPTS_DIR = "src/concepts/Scriblink";

function toPascalCase(name: string) {
  return name
    .replace(/[-_\. ]+/g, " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/**
 * Main server function to initialize DB, load concepts, and start the server.
 */
async function main() {
  const [db] = await getDb();
  const app = new Hono();

  app.get("/", (c) => c.text("Concept Server is running."));

  // --- Dynamic Concept Loading and Routing ---
  console.log(`Scanning for concepts in ./${CONCEPTS_DIR}...`);

  for await (const entry of walk(CONCEPTS_DIR, { maxDepth: 2, includeDirs: false, includeFiles: true })) {
    if (!entry.name.endsWith("Concept.ts")) continue;

    const filePath = entry.path;
    const fileNameNoExt = entry.name.replace(/\.ts$/i, "");
    const parentDirName = filePath.substring(0, filePath.lastIndexOf("/")).split("/").pop() || "";
    const rawConceptName = parentDirName && parentDirName !== CONCEPTS_DIR.split("/").pop() ? parentDirName : fileNameNoExt.replace(/Concept$/i, "");
    const conceptName = toPascalCase(rawConceptName);

    try {
      const modulePath = toFileUrl(Deno.realPathSync(filePath)).href;
      const module = await import(modulePath);
      const exported = module.default;

      const mountPaths = [`${BASE_URL}/${conceptName}`, `${BASE_URL}/${conceptName}Concept`];

      // If the module exports a Hono app/router, mount it directly (support both path variants)
      if (exported && typeof exported === "object" && (typeof exported.handle === "function" || typeof exported.fetch === "function")) {
        for (const routePath of mountPaths) {
          app.route(routePath, exported);
          console.log(`Mounted Hono router at ${routePath}`);
        }
        continue;
      }

      // If the module exports a class named *Concept, instantiate and expose public methods
      if (typeof exported === "function" && exported.name.endsWith("Concept")) {
        const InstanceClass = exported;
        const instance = new InstanceClass(db);

        const proto = Object.getPrototypeOf(instance);
        const methodNames = Object.getOwnPropertyNames(proto).filter(
          (n) => n !== "constructor" && typeof proto[n] === "function" && !n.startsWith("_"),
        );

        for (const methodName of methodNames) {
          for (const base of mountPaths) {
            const route = `${base}/${methodName}`;
            app.post(route, async (c) => {
              try {
                let payload: any = {};
                try {
                  payload = await c.req.json();
                } catch {
                  payload = {};
                }
                const result = await (instance as any)[methodName](payload);
                if (result && typeof result === "object" && "error" in result) {
                  return c.json(result, 400);
                }
                return c.json(result ?? {}, 200);
              } catch (err) {
                console.error(`Error executing ${methodName} on ${conceptName}:`, err);
                return c.json({ error: "Internal Server Error" }, 500);
              }
            });
            console.log(`Registered POST ${route}`);
          }
        }
        continue;
      }

      console.warn(`No valid export found in ${filePath}. Skipping.`);
    } catch (err) {
      console.error(`Failed to load concept from ${filePath}:`, err);
    }
  }

  console.log(`Starting server on http://localhost:${PORT}${BASE_URL}`);
  await Deno.serve({ port: PORT }, app.fetch as any);
}

main();
