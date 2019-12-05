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

