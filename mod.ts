// Copyright (c) 2019 Rafał Pocztarski, Jesse Jackson. All rights reserved.
// MIT License (Expat). See: https://github.com/rsp/deno-clipboard

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type LinuxBinary = 'wsl' | 'xclip' | 'xsel';

type Config = {
  linuxBinary: LinuxBinary;
};

const config: Config = {linuxBinary: 'xsel'};

const errMsg = {
  genericRead: 'There was a problem reading from the clipboard',
  genericWrite: 'There was a problem writing to the clipboard',
  noClipboard: 'No supported clipboard utility. "xsel" or "xclip" must be installed.',
  noClipboardWSL: 'Windows tools not found in $PATH. See https://docs.microsoft.com/en-us/windows/wsl/interop#run-windows-tools-from-linux',
  osUnsupported: 'Unsupported operating system',
};

const normalizeNewlines = (str: string) => str.replace(/\r\n/gu, '\n');
const trimNewlines = (str: string) => str.replace(/(?:\r\n|\n)+$/u, '');

/**
 * Options to change the parsing behavior when reading the clipboard text
 *
 * `trimFinalNewlines?` — Trim trailing newlines. Default is `true`.
 *
 * `unixNewlines?` — Convert all CRLF newlines to LF newlines. Default is `true`.
 */
export type ReadTextOptions = {
  trimFinalNewlines?: boolean;
  unixNewlines?: boolean;
};

type TextClipboard = {
  readText: (readTextOptions?: ReadTextOptions) => Promise<string>;
  writeText: (data: string) => Promise<void>;
};

const shared = {
  async readText (
    cmd: string[],
    {trimFinalNewlines = true, unixNewlines = true}: ReadTextOptions = {},
  ): Promise<string> {
    const p = Deno.run({cmd, stdout: 'piped'});

    const {success} = await p.status();
    const stdout = decoder.decode(await p.output());
    p.close();

    if (!success) throw new Error(errMsg.genericRead);

    let result = stdout;
    if (unixNewlines) result = normalizeNewlines(result);
    if (trimFinalNewlines) return trimNewlines(result);
    return result;
  },

  async writeText (cmd: string[], data: string): Promise<void> {
    const p = Deno.run({cmd, stdin: 'piped'});

    if (!p.stdin) throw new Error(errMsg.genericWrite);
    await p.stdin.write(encoder.encode(data));
    p.stdin.close();

    const {success} = await p.status();
    if (!success) throw new Error(errMsg.genericWrite);

    p.close();
  },
};

const darwin: TextClipboard = {
  readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmd: string[] = ['pbpaste'];
    return shared.readText(cmd, readTextOptions);
  },

  writeText (data: string): Promise<void> {
    const cmd: string[] = ['pbcopy'];
    return shared.writeText(cmd, data);
  },
};

const linux: TextClipboard = {
  readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmds: {[key in LinuxBinary]: string[]} = {
      wsl: ['powershell.exe', '-NoProfile', '-Command', 'Get-Clipboard'],
      xclip: ['xclip', '-selection', 'clipboard', '-o'],
      xsel: ['xsel', '-b', '-o'],
    };

    const cmd = cmds[config.linuxBinary];
    return shared.readText(cmd, readTextOptions);
  },

  writeText (data: string): Promise<void> {
    const cmds: {[key in LinuxBinary]: string[]} = {
      wsl: ['clip.exe'],
      xclip: ['xclip', '-selection', 'clipboard'],
      xsel: ['xsel', '-b', '-i'],
    };

    const cmd = cmds[config.linuxBinary];
    return shared.writeText(cmd, data);
  },
};

const windows: TextClipboard = {
  readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmd: string[] = ['powershell', '-NoProfile', '-Command', 'Get-Clipboard'];
    return shared.readText(cmd, readTextOptions);
  },

  writeText (data: string): Promise<void> {
    const cmd: string[] = ['powershell', '-NoProfile', '-Command', '$input|Set-Clipboard'];
    return shared.writeText(cmd, data);
  },
};

const getProcessOutput = async (cmd: string[]): Promise<string> => {
  try {
    const p = Deno.run({cmd, stdout: 'piped'});
    const stdout = decoder.decode(await p.output());
    p.close();
    return stdout.trim();
  }
  catch (err) {
    return '';
  }
};

const resolveLinuxBinary = async (): Promise<LinuxBinary> => {
  type BinaryEntry = [LinuxBinary, () => boolean | Promise<boolean>];

  const binaryEntries: BinaryEntry[] = [
    ['wsl', async () => {
      const isWSL = (await getProcessOutput(['uname', '-r', '-v'])).toLowerCase().includes('microsoft');
      if (!isWSL) return false;
      const hasWindowsUtils = (
        Boolean(await getProcessOutput(['which', 'clip.exe']))
        && Boolean(await getProcessOutput(['which', 'powershell.exe']))
      );
      if (hasWindowsUtils) return true;
      throw new Error(errMsg.noClipboardWSL);
    }],
    ['xsel', async () => Boolean(await getProcessOutput(['which', 'xsel']))],
    ['xclip', async () => Boolean(await getProcessOutput(['which', 'xclip']))],
  ];

  for (const [binary, matchFn] of binaryEntries) {
    const binaryMatches = await matchFn();
    if (binaryMatches) return binary;
  }

  throw new Error(errMsg.noClipboard);
};

type Clipboards = {[key in typeof Deno.build.os]: TextClipboard};

const clipboards: Clipboards = {
  darwin,
  linux,
  windows,
};

const {build: {os}} = Deno;

if (os === 'linux') config.linuxBinary = await resolveLinuxBinary();
else if (!clipboards[os]) throw new Error(errMsg.osUnsupported);

/**
 * Reads the clipboard and returns a string containing the text contents. Requires the `--allow-run` flag.
 */
export const readText: (readTextOptions?: ReadTextOptions) => Promise<string> = clipboards[os].readText;

/**
 * Writes a string to the clipboard. Requires the `--allow-run` flag.
 */
export const writeText: (data: string) => Promise<void> = clipboards[os].writeText;
