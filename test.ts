// Copyright (c) 2019 Rafał Pocztarski. All rights reserved.
// MIT License (Expat). See: https://github.com/rsp/deno-clipboard

import { test } from 'https://deno.land/std@v0.25.0/testing/mod.ts';
import { assertEquals } from 'https://deno.land/std@v0.25.0/testing/asserts.ts';

import { clipboard } from './mod.ts';

// The tests currently ingnore trailing newlines
// because of some issues on Windows, see Readme.

test({
  name: 'single line data',
  async fn() {
    const input = 'single line data';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output.replace(/\n+$/, ''), input.replace(/\n+$/, ''));
  }
});

test({
  name: 'multi line data',
  async fn() {
    const input = 'multi\nline\ndata';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output.replace(/\n+$/, ''), input.replace(/\n+$/, ''));
  }
});

test({
  name: 'multi line data dangling newlines',
  async fn() {
    const input = '\n\n\nmulti\n\n\n\n\n\nline\ndata\n\n\n\n\n';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output.replace(/\n+$/, ''), input.replace(/\n+$/, ''));
  }
});

test({
  name: 'data with special characters',
  async fn() {
    const input = '`~!@#$%^&*()_+-=[]{};\':",./<>?\t\n';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output.replace(/\n+$/, ''), input.replace(/\n+$/, ''));
  }
});

test({
  name: 'data with unicode characters',
  async fn() {
    const input = 'Rafał';
    await clipboard.writeText(input);
    const output = await clipboard.readText();
    assertEquals(output.replace(/\n+$/, ''), input.replace(/\n+$/, ''));
  }
});
