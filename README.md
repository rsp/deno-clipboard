Deno clipboard library
=

[![Build Status][actions-img]][actions-url]<br>(CI tests on Linux, Mac, Windows)

> On Linux, `xsel` or `xclip` must be installed and in your `PATH`.

Usage
-

```ts
import * as clipboard from 'https://deno.land/x/clipboard/mod.ts';

await clipboard.writeText('some text');

const text = await clipboard.readText();

console.log(text === 'some text'); // true
```

Goals
-

- use Web [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard)
- use readText and writeText (no read and write, see the spec)
- work on Linux, macOS, Windows
- don't bundle any binaries

It will spawn external processes so unfortunately
it will require the all-powerful `--allow-run` flag.

If Deno exposes a Clipboard API
(with new permissions like `--allow-copy` and `--allow-paste`)
then hopefully this will be obsolete. See the relevant issue:

- [denoland/deno#3450 Support of Clipboard API without `--deno-run`](https://github.com/denoland/deno/issues/3450)

Options
-
The clipboard on Windows always adds a trailing newline if there was none,
which makes single line strings end with a newline. Newlines in the clipboard are sometimes
problematic (like automatically starting commands when pasted into the terminal), so this module trims trailing newlines by default. It also converts CRLF (Windows) newlines to LF (Unix) newlines by default when reading the clipboard.

Both of these options can be disabled independently:

```ts
import * as clipboard from 'https://deno.land/x/clipboard/mod.ts';

const options: clipboard.ReadTextOptions = {
  trimFinalNewlines: false, // don't trim trailing newlines
  unixNewlines: false, // don't convert CRLF to LF
};

const clipboardText = await clipboard.readText(options);
```

Issues
-
For any bug reports or feature requests please
[post an issue on GitHub][issues-url].

Author
-
[**Rafał Pocztarski**](https://pocztarski.com/)
<br/>
[![Follow on GitHub][github-follow-img]][github-follow-url]
[![Follow on Twitter][twitter-follow-img]][twitter-follow-url]
<br/>
[![Follow on Stack Exchange][stackexchange-img]][stackoverflow-url]

Contributors
-
- [**Jesse Jackson**](https://github.com/jsejcksn)

License
-
MIT License (Expat). See [LICENSE.md](LICENSE.md) for details.

[github-url]: https://github.com/rsp/deno-clipboard
[readme-url]: https://github.com/rsp/deno-clipboard#readme
[issues-url]: https://github.com/rsp/deno-clipboard/issues
[license-url]: https://github.com/rsp/deno-clipboard/blob/master/LICENSE.md
[actions-url]: https://github.com/rsp/deno-clipboard/actions
[actions-img]: https://github.com/rsp/deno-clipboard/workflows/ci/badge.svg?branch=master&event=push
[travis-url]: https://travis-ci.org/rsp/deno-clipboard
[travis-img]: https://travis-ci.org/rsp/deno-clipboard.svg?branch=master
[snyk-url]: https://snyk.io/test/github/rsp/deno-clipboard
[snyk-img]: https://snyk.io/test/github/rsp/deno-clipboard/badge.svg
[david-url]: https://david-dm.org/rsp/deno-clipboard
[david-img]: https://david-dm.org/rsp/deno-clipboard/status.svg
[install-img]: https://nodei.co/npm/ende.png?compact=true
[downloads-img]: https://img.shields.io/npm/dt/ende.svg
[license-img]: https://img.shields.io/npm/l/ende.svg
[stats-url]: http://npm-stat.com/charts.html?package=ende
[github-follow-url]: https://github.com/rsp
[github-follow-img]: https://img.shields.io/github/followers/rsp.svg?style=social&logo=github&label=Follow
[twitter-follow-url]: https://twitter.com/intent/follow?screen_name=pocztarski
[twitter-follow-img]: https://img.shields.io/twitter/follow/pocztarski.svg?style=social&logo=twitter&label=Follow
[stackoverflow-url]: https://stackoverflow.com/users/613198/rsp
[stackexchange-url]: https://stackexchange.com/users/303952/rsp
[stackexchange-img]: https://stackexchange.com/users/flair/303952.png
