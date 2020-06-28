import {assert, assertEquals} from 'https://deno.land/std@0.59.0/testing/asserts.ts';
import {readText, writeText} from './mod.ts';

type Test = [string, () => void | Promise<void>];

const tests: Test[] = [
  ['reads/writes without throwing', async () => {
    const input = 'hello world';
    await writeText(input);
    await readText();
  }],
  ['single line data', async () => {
    const input = 'single line data';
    await writeText(input);
    const output = await readText();
    assertEquals(output.replace(/\n+$/u, ''), input.replace(/\n+$/u, ''));
  }],
  ['multi line data', async () => {
    const input = 'multi\nline\ndata';
    await writeText(input);
    const output = await readText();
    assertEquals(output.replace(/\n+$/u, ''), input.replace(/\n+$/u, ''));
  }],
  ['multi line data dangling newlines', async () => {
    const input = '\n\n\nmulti\n\n\n\n\n\nline\ndata\n\n\n\n\n';
    await writeText(input);
    const output = await readText({trimFinalNewlines: false});
    assertEquals(output.replace(/\n+$/u, ''), input.replace(/\n+$/u, ''));
  }],
  ['data with special characters', async () => {
    const input = '`~!@#$%^&*()_+-=[]{};\':",./<>?\t\n';
    await writeText(input);
    const output = await readText({trimFinalNewlines: false});
    assertEquals(output.replace(/\n+$/u, ''), input.replace(/\n+$/u, ''));
  }],
  ['data with unicode characters', async () => {
    const input = 'Rafał';
    await writeText(input);
    const output = await readText();
    assertEquals(output.replace(/\n+$/u, ''), input.replace(/\n+$/u, ''));
  }],
  ['option: trim', async () => {
    const input = 'hello world\n\n';
    const inputTrimmed = 'hello world';
    await writeText(input);
    const output = await readText({trimFinalNewlines: false});
    const outputTrimmed = await readText({trimFinalNewlines: true});
    const outputDefault = await readText();
    assert(output !== inputTrimmed && output.trim() === inputTrimmed);
    assertEquals(inputTrimmed, outputTrimmed);
    assertEquals(inputTrimmed, outputDefault);
  }],
  ['option: unixNewlines', async () => {
    const inputCRLF = 'hello\r\nworld';
    const inputLF = 'hello\nworld';
    await writeText(inputCRLF);
    const output = await readText({unixNewlines: false});
    const outputUnix = await readText({unixNewlines: true});
    const outputDefault = await readText();
    assertEquals(inputCRLF, output);
    assertEquals(inputLF, outputUnix);
    assertEquals(inputLF, outputDefault);
  }],
];

for (const [name, fn] of tests) Deno.test({fn, name});
