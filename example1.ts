import * as clipboard from './mod.ts';

const text = 'abcaaa';

await clipboard.writeText(text);

console.log(await clipboard.readText());
