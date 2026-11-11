import fs from 'fs';
import path from 'path';

const batchOps = [
  {
    op: 'write',
    range: 'TangToc!B5',
    data: [
      ['Trong một cuộc thi có 4 bạn An, Bình, Cường, Dũng đạt 4 vị trí nhất, nhì, ba, tư. Biết: An không phải nhất; Bình về ngay trước An; Dũng không về cuối cùng; Cường về nhì. Hỏi ai là người đạt giải nhất?']
    ]
  }
];

const batchFile = path.resolve('scratch/clean_tangtoc4.json');
fs.writeFileSync(batchFile, JSON.stringify(batchOps, null, 2), 'utf-8');
console.log('Created batch file for cleaning TangToc B5');
