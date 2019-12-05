import { test } from 'https://deno.land/std/testing/mod.ts';
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

import { clipboard } from './mod.ts';

test({
  name: 'single line data',
  async fn() {
    const input = 'single line data';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output, input);
  }
});

test({
  name: 'multi line data',
  async fn() {
    const input = 'multi\nline\ndata';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output, input);
  }
});

test({
  name: 'multi line data dangling newlines',
  async fn() {
    const input = '\n\n\nmulti\n\n\n\n\n\nline\ndata\n\n\n\n\n';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output, input);
  }
});
