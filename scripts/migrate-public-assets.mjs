/** Move public raster images/PDFs to Firebase without changing existing URLs.
 * Dry run: node scripts/migrate-public-assets.mjs
 * Upload/verify: node --env-file=<credentials.env> scripts/migrate-public-assets.mjs --upload
 * After verification: same command with --upload --apply
 * Supports FIREBASE_SERVICE_ACCOUNT (base64 JSON), split FIREBASE_* credentials,
 * or Google Application Default Credentials. Never changes bucket access rules.
 */
import { readFile, readdir, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const manifestPath = path.join(root, 'data', 'public-assets.json');
const bucketName = 'imheretravels-a3f81.firebasestorage.app';
const types = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.pdf':'application/pdf' };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
async function collect(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(full));
    else if (entry.isFile() && types[path.extname(entry.name).toLowerCase()]) files.push(full);
  }
  return files.sort();
}
const files = await collect(publicRoot);
const entries = await Promise.all(files.map(async file => {
  const bytes = await readFile(file);
  return { file, source: '/' + path.relative(publicRoot, file).split(path.sep).join('/'), bytes:bytes.length, sha256:digest(bytes) };
}));
console.log(JSON.stringify({ bucket:bucketName, files:entries.length, megabytes:entries.reduce((n,e)=>n+e.bytes,0)/1024**2 }));
if (!process.argv.includes('--upload')) process.exit(0);
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) credential = cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()));
else if (process.env.FIREBASE_PRIVATE_KEY) credential = cert({ projectId:process.env.FIREBASE_PROJECT_ID, clientEmail:process.env.FIREBASE_CLIENT_EMAIL, privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') });
else credential = applicationDefault();
const app = initializeApp({ credential, storageBucket:bucketName });
const bucket = getStorage(app).bucket();
// Verify access to the intended production bucket before uploading anything.
await bucket.getMetadata();
let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let completed = 0;
const queue = [...entries];
await Promise.all(Array.from({length:12}, async () => {
  while (queue.length) {
    const entry = queue.shift();
    const bytes = await readFile(entry.file);
    const objectPath = `website-assets/${entry.sha256}${path.extname(entry.file).toLowerCase()}`;
    const object = bucket.file(objectPath);
    const [exists] = await object.exists();
    if (!exists) {
      try {
        await object.save(bytes, { resumable:false, preconditionOpts:{ifGenerationMatch:0}, metadata:{ contentType:types[path.extname(entry.file).toLowerCase()], cacheControl:'public, max-age=31536000, immutable', metadata:{firebaseStorageDownloadTokens:randomUUID(),sha256:entry.sha256} } });
      } catch (error) {
        // Identical local files can share one content-addressed cloud object.
        if (error.code !== 412) throw error;
      }
    }
    const [metadata] = await object.getMetadata();
    const token = metadata.metadata?.firebaseStorageDownloadTokens?.split(',')[0];
    if (!token) throw new Error(`Missing download token: ${entry.source}`);
    const destination = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encode(objectPath)}?alt=media&token=${token}`;
    const response = await fetch(destination, { signal:AbortSignal.timeout(60_000) });
    if (!response.ok || digest(Buffer.from(await response.arrayBuffer())) !== entry.sha256) throw new Error(`Public download verification failed: ${entry.source}`);
    manifest[entry.source] = { destination, sha256:entry.sha256, bytes:entry.bytes };
    if (++completed % 25 === 0) console.log(`Verified ${completed}/${entries.length}`);
  }
}));
// Write the complete verified mapping before removing any bundled files.
await writeFile(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)+'\n');
if (process.argv.includes('--apply')) {
  // Keep a local, ignored recovery copy outside public; never delete cloud objects.
  const backupRoot = path.join(root, '.asset-backup');
  for (const entry of entries) {
    const resolved = path.resolve(entry.file);
    if (!resolved.startsWith(publicRoot + path.sep)) throw new Error('Path outside public');
    const bytes = await readFile(resolved);
    if (digest(bytes) !== entry.sha256) throw new Error(`File changed: ${entry.source}`);
    const backup = path.join(backupRoot, entry.source.slice(1));
    await mkdir(path.dirname(backup), {recursive:true});
    await writeFile(backup, bytes);
    await unlink(resolved);
  }
}
console.log(`Verified ${completed} assets. ${process.argv.includes('--apply') ? 'Removed bundled copies; backups are in .asset-backup.' : 'Run with --apply to remove bundled copies.'}`);
