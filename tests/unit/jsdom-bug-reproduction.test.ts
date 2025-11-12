/**
 * Minimal Reproduction of JSDOM Table Cell Removal Bug
 *
 * This test isolates the JSDOM bug where the third table column
 * is removed when it contains complex HTML like <ol> elements.
 *
 * Expected: PASS locally, FAIL in CI
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('JSDOM Table Cell Bug - Minimal Reproduction', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    console.log('Node version:', process.version);
    console.log('JSDOM version:', require('jsdom/package.json').version);

    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  it('BUG: Third cell with <ol> is removed', () => {
    console.log('\n=== TEST 1: Third cell with <ol> ===');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>Column 1</td>
            <td>Column 2</td>
            <td><ol><li>Item A</li><li>Item B</li><li>Item C</li></ol></td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    console.log('Before append - innerHTML:', tempDiv.innerHTML.substring(0, 200));

    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('After append - cell count:', cells.length);
    console.log('After append - row HTML:', row.innerHTML.substring(0, 200));

    Array.from(cells).forEach((cell, idx) => {
      console.log(`  Cell ${idx + 1}:`, cell.innerHTML.substring(0, 50));
    });

    // EXPECTED: 3 cells
    // ACTUAL IN CI: 2 cells
    expect(cells.length).toBe(3);

    const thirdCell = row.querySelector('td:nth-child(3)');
    expect(thirdCell).toBeDefined();
    expect(thirdCell?.querySelector('ol')).toBeDefined();
  });

  it('CONTROL: Third cell with simple text works', () => {
    console.log('\n=== TEST 2: Third cell with simple text (CONTROL) ===');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>Column 1</td>
            <td>Column 2</td>
            <td>Simple text</td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('Cell count:', cells.length);

    // This should PASS in both local and CI
    expect(cells.length).toBe(3);
  });

  it('BUG: Third cell with <ul> also removed', () => {
    console.log('\n=== TEST 3: Third cell with <ul> ===');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>Column 1</td>
            <td>Column 2</td>
            <td><ul><li>Item A</li><li>Item B</li></ul></td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('Cell count:', cells.length);
    console.log('Row HTML:', row.innerHTML.substring(0, 200));

    // Test if <ul> triggers same bug as <ol>
    expect(cells.length).toBe(3);
  });

  it('BUG: Multiple rows - all affected', () => {
    console.log('\n=== TEST 4: Multiple rows with <ol> ===');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>Q1</td>
            <td>A1</td>
            <td><ol><li>Option 1</li><li>Option 2</li></ol></td>
          </tr>
          <tr>
            <td>Q2</td>
            <td>A2</td>
            <td><ol><li>Option A</li><li>Option B</li></ol></td>
          </tr>
        </tbody>
      </table>
    `;

    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const rows = table.querySelectorAll('tbody tr');

    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      console.log(`Row ${idx + 1} cell count:`, cells.length);
      expect(cells.length).toBe(3);
    });
  });

  it('WORKAROUND TEST: Build table in document first', () => {
    console.log('\n=== TEST 5: Build in document first (WORKAROUND) ===');

    // Try building table while already in document
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');

    // Append to document FIRST
    table.appendChild(tbody);
    tbody.appendChild(tr);
    document.body.appendChild(table);

    // NOW create cells
    const td1 = document.createElement('td');
    td1.textContent = 'Column 1';

    const td2 = document.createElement('td');
    td2.textContent = 'Column 2';

    const td3 = document.createElement('td');

    // Append cells
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);

    console.log('After structure created, cells:', tr.querySelectorAll('td').length);

    // NOW set complex content
    td3.innerHTML = '<ol><li>Item A</li><li>Item B</li></ol>';

    const cells = tr.querySelectorAll('td');
    console.log('After setting innerHTML, cells:', cells.length);
    console.log('Row HTML:', tr.innerHTML.substring(0, 200));

    expect(cells.length).toBe(3);
  });
});
