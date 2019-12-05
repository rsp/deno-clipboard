import { clipboard } from './mod.ts';

await clipboard.writeText('some text');

const text = await clipboard.readText();

console.log(text === 'some text'); // true
