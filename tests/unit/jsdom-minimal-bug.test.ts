/**
 * Minimal JSDOM Table Cell Bug Reproduction
 *
 * This test reproduces the JSDOM bug where table cells containing
 * complex HTML (like <ol> elements) cause adjacent cells to disappear.
 *
 * Expected: PASS locally (Node 22), FAIL in CI (Node 18 or misconfigured JSDOM)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('JSDOM Table Cell Bug - Minimal Test', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    console.log('=== ENVIRONMENT ===');
    console.log('Node version:', process.version);
    console.log('JSDOM version:', require('jsdom/package.json').version);
    console.log('===================\n');

    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  it('REPRO: Table with <ol> in third cell - innerHTML on div approach', () => {
    console.log('\n=== TEST: innerHTML on div ===');

    // Build table HTML as string
    const tableHtml = `
      <table class="test-table">
        <tbody>
          <tr>
            <td>Column 1</td>
            <td>Column 2</td>
            <td><ol><li>Option A</li><li>Option B</li><li>Option C</li></ol></td>
          </tr>
        </tbody>
      </table>
    `;

    // Use innerHTML on a temp div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;

    console.log('Before extracting table:');
    console.log('  tempDiv.innerHTML length:', tempDiv.innerHTML.length);

    // Extract table
    const table = tempDiv.querySelector('table')!;

    console.log('After extracting table:');
    console.log('  table exists:', !!table);

    // Append to document
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('After appending to document:');
    console.log('  Cell count:', cells.length);
    console.log('  Row HTML:', row.innerHTML.substring(0, 150));

    Array.from(cells).forEach((cell, idx) => {
      console.log(`  Cell ${idx + 1}:`, cell.innerHTML.substring(0, 40));
    });

    expect(cells.length).toBe(3);
  });

  it('REPRO: Table with <ol> in third cell - build in document approach', () => {
    console.log('\n=== TEST: Build in document ===');

    const table = document.createElement('table');
    table.className = 'test-table';
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Append to document FIRST
    document.body.appendChild(table);

    console.log('Table appended to document');

    // Create row
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);

    console.log('After creating empty cells:', tr.querySelectorAll('td').length, 'cells');

    // Set content
    td1.textContent = 'Column 1';
    td2.textContent = 'Column 2';

    console.log('After setting text content:', tr.querySelectorAll('td').length, 'cells');

    // Use innerHTML on cell AFTER it's in document
    td3.innerHTML = '<ol><li>Option A</li><li>Option B</li><li>Option C</li></ol>';

    const cells = tr.querySelectorAll('td');
    console.log('After setting innerHTML on td3:', cells.length, 'cells');
    console.log('Row HTML:', tr.innerHTML.substring(0, 150));

    expect(cells.length).toBe(3);
  });

  it('REPRO: Table with <ol> in third cell - pure DOM approach', () => {
    console.log('\n=== TEST: Pure DOM (no innerHTML) ===');

    const table = document.createElement('table');
    table.className = 'test-table';
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    // Append to document FIRST
    document.body.appendChild(table);

    console.log('Table appended to document');

    // Create row
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);

    console.log('After creating empty cells:', tr.querySelectorAll('td').length, 'cells');

    // Set content
    td1.textContent = 'Column 1';
    td2.textContent = 'Column 2';

    console.log('After setting text content:', tr.querySelectorAll('td').length, 'cells');

    // Build <ol> programmatically (NO innerHTML)
    const ol = document.createElement('ol');
    const li1 = document.createElement('li');
    li1.textContent = 'Option A';
    const li2 = document.createElement('li');
    li2.textContent = 'Option B';
    const li3 = document.createElement('li');
    li3.textContent = 'Option C';
    ol.appendChild(li1);
    ol.appendChild(li2);
    ol.appendChild(li3);
    td3.appendChild(ol);

    const cells = tr.querySelectorAll('td');
    console.log('After building <ol> with DOM methods:', cells.length, 'cells');
    console.log('Row HTML:', tr.innerHTML.substring(0, 150));

    expect(cells.length).toBe(3);
  });

  it('CONTROL: Table with simple text in third cell', () => {
    console.log('\n=== TEST: Simple text (CONTROL) ===');

    const tableHtml = `
      <table class="test-table">
        <tbody>
          <tr>
            <td>Column 1</td>
            <td>Column 2</td>
            <td>Simple text</td>
          </tr>
        </tbody>
      </table>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;
    const table = tempDiv.querySelector('table')!;
    document.body.appendChild(table);

    const row = table.querySelector('tbody tr')!;
    const cells = row.querySelectorAll('td');

    console.log('Cell count:', cells.length);

    expect(cells.length).toBe(3);
  });
});
