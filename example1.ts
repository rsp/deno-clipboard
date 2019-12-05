import { clipboard } from './mod.ts';

const x = 'abcaaa';

await clipboard.writeText(x);

console.log(await clipboard.readText());
