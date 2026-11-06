import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/plan.js';
import '../extension/preset.js';
test('악뮤 공연과 회차는 고정, 선택 구역을 우선함',()=>{const p=AkmuPreset.plan({count:4,section:'106',position:'front',url:'https://example.org'});assert.equal(p.url,'https://ticket.yes24.com/Special/60840');assert.equal(p.sections[0],'106');assert.equal(p.position,'front');assert.equal(p.count,4);});
test('최대 4매와 올바른 구역·위치만 허용',()=>{for(const p of [{count:5},{count:0},{count:2,section:'999'},{count:2,position:'other'}])assert.throws(()=>AkmuPreset.plan(p));});
