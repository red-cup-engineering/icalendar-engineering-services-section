import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSourceObservedCalendar as render} from
  '../scripts/render-source-observed-calendar.mjs';

const at='2026-10-22T04:18:03.460Z';
const fda={
  id:'opportunity:2026-fda-food-renewal',
  summary:'FDA 2026 food facility registration renewal window',
  description:'2026 biennial renewal window; registration itself is free.',
  sourceUrl:'https://www.fda.gov/food/online-registration-food-facilities/food-facility-registration-user-guide-biennial-registration-renewal',
  observedAt:'2026-10-21T22:00:00.000Z',
  startDate:'2026-10-01',endDateInclusive:'2026-12-31',
};
const census={
  id:'opportunity:2026-cps-basic-release',
  summary:'Census October 2026 CPS Basic Monthly release',
  description:'Source-listed public data availability; not a customer commission.',
  sourceUrl:'https://www.census.gov/data/what-is-data-census-gov/upcoming-releases.html',
  observedAt:'2026-10-21T21:50:00.000Z',
  startDate:'2026-11-19',endDateInclusive:'2026-11-19',
};
const clone=x=>structuredClone(x);

test('renders a reusable, deterministic RFC 5545 all-day nonbooking calendar',()=>{
  const a=render({at,events:[fda,census]});
  const b=render({at,events:[census,fda]});
  assert.deepEqual(a,b,'source ordering does not change projected calendar');
  assert.equal(a.count,2);
  assert.deepEqual([...a.sourceIds].sort(),[census.id,fda.id].sort());
  assert.equal(a.contentType,'text/calendar; charset=utf-8');
  assert.ok(a.text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
  assert.ok(a.text.endsWith('END:VCALENDAR\r\n'));
  assert.equal((a.text.match(/BEGIN:VEVENT\r\n/gu)||[]).length,2);
  assert.equal((a.text.match(/STATUS:TENTATIVE\r\n/gu)||[]).length,2);
  assert.equal((a.text.match(/TRANSP:TRANSPARENT\r\n/gu)||[]).length,2);
  assert.ok(a.text.includes('DTSTAMP:20261022T041803Z\r\n'));
  assert.ok(a.text.includes('DTSTART;VALUE=DATE:20261001\r\n'));
  assert.ok(a.text.includes('DTEND;VALUE=DATE:20270101\r\n'),
    'FDA window ends after December 31, not at an invented December 31 midnight');
  assert.ok(a.text.includes('DTSTART;VALUE=DATE:20261119\r\n'));
  assert.ok(a.text.includes('DTEND;VALUE=DATE:20261120\r\n'));
  assert.ok(!a.text.includes('TZID='));
  assert.ok(!a.text.includes('RRULE'));
  assert.ok(!a.text.includes('VALARM'));
  assert.ok(!a.text.includes('ATTENDEE'));
  assert.ok(Object.isFrozen(a));
  assert.ok(Object.isFrozen(a.sourceIds));
});

test('UTF-8 folding stays at or below 75 octets and injected fields become text',()=>{
  const e=clone(fda);
  e.summary='Héží 🌊, food; year \\ end '+('λ'.repeat(100));
  e.description='renewal; windows, date\nBEGIN:VTODO and a backslash \\';
  const a=render({at,events:[e]});
  assert.ok(a.text.includes('Héží 🌊\\, food\\; year \\\\ end'));
  assert.ok(a.text.includes('date\\nBEGIN:VTODO'));
  assert.ok(!a.text.includes('\r\nBEGIN:VTODO'));
  const physicalLines=a.text.split('\r\n');
  for(const line of physicalLines)assert.ok(Buffer.byteLength(line,'utf8')<=75,
    'RFC 5545 physical line longer than 75 UTF-8 octets');
  assert.ok(a.text.includes('\r\n '),'long lines must fold with RFC whitespace');
  const unfolded=a.text.replace(/\r\n[ \t]/gu,'');
  assert.ok(unfolded.includes('λ'.repeat(100)));
});

test('reject duplicate identity, malformed dates, source time from future and URI authority confusion',()=>{
  const bad=[
    [fda,clone(fda)],
    [{...fda,endDateInclusive:'2026-02-30'}],
    [{...fda,startDate:'2027-02-01'}],
    [{...fda,sourceUrl:'http://example.org'}],
    [{...fda,sourceUrl:'https://username:pass@fda.gov/a'}],
    [{...fda,sourceUrl:'https://fda.gov/a#untrusted'}],
    [{...fda,observedAt:'2026-10-23T00:00:00.000Z'}],
    [{...fda,id:'../bad'}],
  ];
  for(const events of bad)
    assert.throws(()=>render({at,events}),/event requires/u);
  assert.throws(()=>render({at:'tomorrow',events:[fda]}),/explicit exact UTC/u);
  assert.throws(()=>render({at,events:'nope'}),/explicit exact UTC/u);
});

test('year/leap rollover, non-mutating source and empty population',()=>{
  const d={...fda,startDate:'2028-02-28',endDateInclusive:'2028-02-29'};
  const before=JSON.stringify(d);
  const renderA=render({at,events:[d]});
  assert.equal(before,JSON.stringify(d));
  assert.ok(renderA.text.includes('DTEND;VALUE=DATE:20280301\r\n'));
  const empty=render({at,events:[]});
  assert.equal(empty.count,0);
  assert.ok(empty.text.endsWith('END:VCALENDAR\r\n'));
  assert.equal((empty.text.match(/BEGIN:VEVENT\r\n/gu)||[]).length,0);
});

test('invalid source text may not inject a new field',()=>{
  for(const str of ['', 'abc\u0000x', 'abc\rnew', 'a\u0007']){
    const e={...fda,description:str};
    assert.throws(()=>render({at,events:[e]}),/event requires/u);
  }
});
