#!/usr/bin/env node
import { connect } from './cdp.js';
import { writeFile } from 'fs/promises';
const targetUrl = process.argv[2] || 'http://localhost:5173';
const code = process.argv.slice(3).join(' ');
const cdp = await connect(5000);
const pages = await cdp.getPages();
const page = pages.find(t => t.url.startsWith(targetUrl)) || pages.find(t => t.url.includes('localhost:5173'));
if (!page) throw new Error('No target for ' + targetUrl + ' pages=' + pages.map(p=>p.url).join(','));
const sessionId = await cdp.attachToPage(page.targetId);
if (!code) console.log(JSON.stringify({id: page.targetId, title: page.title, url: page.url}, null, 2));
else if (code === '--screenshot') {
  await cdp.send('Page.bringToFront', {}, sessionId).catch(()=>{});
  const buf = await cdp.screenshot(sessionId, 30000);
  const path = `/tmp/cdp-shot-${Date.now()}.png`;
  await writeFile(path, buf);
  console.log(path);
} else {
  const result = await cdp.evaluate(sessionId, `(async()=>(${code}))()`, 30000);
  console.log(JSON.stringify(result, null, 2));
}
cdp.close();
