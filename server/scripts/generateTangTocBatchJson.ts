import fs from 'fs';
import { NEW_TANGTOC_30 } from './testTangToc30.js';

const batchOps = [
  {
    op: 'write',
    range: 'TangToc!A6:D35',
    data: NEW_TANGTOC_30.map(q => [q.Prompt, q.Answer, q.Alternatives, q.Topic])
  }
];

const dest = 'C:/Users/ADMIN/.gemini/antigravity/brain/1f2df474-4ea3-4326-ba00-9d818f03d90b/scratch/add_tangtoc_batch.json';
fs.writeFileSync(dest, JSON.stringify(batchOps, null, 2));
console.log('Batch JSON generated successfully with', NEW_TANGTOC_30.length, 'questions');
