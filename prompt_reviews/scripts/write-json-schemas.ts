import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportBoundaryJsonSchemas } from "../src/domain/jsonSchemas.js";

const outputPath = path.join(process.cwd(), "dist", "domain-boundary-schemas.json");
const schemas = exportBoundaryJsonSchemas();

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}.tmp`, `${JSON.stringify(schemas, null, 2)}\n`, "utf8");
await rename(`${outputPath}.tmp`, outputPath);

console.log(`Wrote ${Object.keys(schemas).length} boundary schemas to ${outputPath}.`);
