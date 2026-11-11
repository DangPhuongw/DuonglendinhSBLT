import fs from 'fs';
import path from 'path';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';

const buf = fs.readFileSync(path.resolve('question-bank/kho-cau-hoi-mau.xlsx'));
try {
  const parsed = parseExcelQuestionSet(buf, 'Kho Mau');
  console.log('Parsed counts:');
  console.log('kdRieng lengths:', parsed.khoiDong.rieng.map(r => r.length));
  console.log('kdChung length:', parsed.khoiDong.chung.length);
  console.log('vcnv rows:', parsed.vcnv.rows.length);
  console.log('vcnv center:', parsed.vcnv.center?.prompt ? 'yes' : 'no');
  console.log('vcnv obstacle:', parsed.vcnv.obstacle?.prompt ? 'yes' : 'no');
  console.log('tangToc length:', parsed.tangToc.length);
  console.log('veDich pool10:', parsed.veDich.pool10.length);
  console.log('veDich pool20:', parsed.veDich.pool20.length);
  console.log('veDich pool30:', parsed.veDich.pool30.length);
  console.log('tieBreak length:', parsed.tieBreak.length);

  const val = validateQuestionSet(parsed);
  console.log('Validation OK:', val.ok);
  if (!val.ok) {
    console.log('Validation Errors:', val.errors);
  }
} catch (e: any) {
  console.error('Error:', e.message);
}
