// Copyright (c) 2019 Rafał Pocztarski, Jesse Jackson. All rights reserved.
// MIT License (Expat). See: https://github.com/rsp/deno-clipboard

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type LinuxBinary = 'wsl' | 'xclip' | 'xsel';

type Config = {
  linuxBinary: LinuxBinary;
};

const config: Config = {
  linuxBinary: 'xsel',
};

const errMsg = {
  genericRead: 'There was a problem reading from the clipboard',
  genericWrite: 'There was a problem writing to the clipboard',
  noClipboardUtility: 'No supported clipboard utility. "xsel" or "xclip" must be installed.',
  osUnsupported: 'Unsupported operating system',
};

export type ReadTextOptions = {
  trim?: boolean;
  unixNewlines?: boolean;
};

type TextClipboard = {
  readText: (readTextOptions?: ReadTextOptions) => Promise<string>;
  writeText: (data: string) => Promise<void>;
};

const shared = {
  async readText (
    cmd: string[],
    {trim = true, unixNewlines = true}: ReadTextOptions = {},
  ): Promise<string> {
    const runOpts: Deno.RunOptions = {
      cmd,
      stdout: 'piped',
    };

    const p = Deno.run(runOpts);

    const {success} = await p.status();
    if (!success) throw new Error(errMsg.genericRead);

    const output = decoder.decode(await p.output());
    p.close();

    let result = output;

    if (unixNewlines) result = result.replace(/\r\n/gu, '\n');
    if (trim) return result.trim();
    else return result;
  },

  async writeText (cmd: string[], data: string): Promise<void> {
    const runOpts: Deno.RunOptions = {
      cmd,
      stdin: 'piped',
    };

    const p = Deno.run(runOpts);

    if (!p.stdin) throw new Error(errMsg.genericWrite);
    await p.stdin.write(encoder.encode(data));
    p.stdin.close();

    const {success} = await p.status();
    if (!success) throw new Error(errMsg.genericWrite);

    p.close();
  }
};

const darwin: TextClipboard = {
  async readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmd: string[] = ['pbpaste'];
    return shared.readText(cmd, readTextOptions);
  },

  async writeText (data: string): Promise<void> {
    const cmd: string[] = ['pbcopy'];
    return shared.writeText(cmd, data);
  }
};

const linux: TextClipboard = {
  async readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmds: {[key in LinuxBinary]: string[]} = {
      wsl: ['powershell.exe', '-NoProfile', '-Command', 'Get-Clipboard'],
      xclip: ['xclip', '-selection', 'clipboard', '-o'],
      xsel: ['xsel', '-b', '-o'],
    };

    const cmd = cmds[config.linuxBinary];
    return shared.readText(cmd, readTextOptions);
  },

  async writeText (data: string): Promise<void> {
    const cmds: {[key in LinuxBinary]: string[]} = {
      wsl: ['clip.exe'],
      xclip: ['xclip', '-selection', 'clipboard'],
      xsel: ['xsel', '-b', '-i'],
    };

    const cmd = cmds[config.linuxBinary];
    return shared.writeText(cmd, data);
  }
};

const windows: TextClipboard = {
  async readText (readTextOptions?: ReadTextOptions): Promise<string> {
    const cmd: string[] = ['powershell', '-NoProfile', '-Command', 'Get-Clipboard'];
    return shared.readText(cmd, readTextOptions);
  },

  async writeText (data: string): Promise<void> {
    const cmd: string[] = ['powershell', '-NoProfile', '-Command', '$input|Set-Clipboard'];
    return shared.writeText(cmd, data);
  }
};

const getProcessOutput = async (cmd: string[]): Promise<string> => {
  const runOpts: Deno.RunOptions = {
    cmd,
    stdout: 'piped',
  };

  const p = Deno.run(runOpts);
  const output = decoder.decode(await p.output());
  p.close();
  return output.trim();
};

const resolveLinuxBinary = async (): Promise<LinuxBinary> => {
  type BinaryEntry = [LinuxBinary, () => boolean | Promise<boolean>];

  const binaryEntries: BinaryEntry[] = [
    ['wsl', async () => (
      (await getProcessOutput(['uname', '-r', '-v'])).toLowerCase().includes('microsoft')
      && Boolean(await getProcessOutput(['which', 'clip.exe']))
      && Boolean(await getProcessOutput(['which', 'powershell.exe']))
    )],
    ['xsel', async () => Boolean(await getProcessOutput(['which', 'xsel']))],
    ['xclip', async () => Boolean(await getProcessOutput(['which', 'xclip']))],
  ];

  for (const [binary, matchFn] of binaryEntries) {
    const binaryMatches = await matchFn();
    if (binaryMatches) return binary;
  }

  throw new Error(errMsg.noClipboardUtility);
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

export const readText = clipboards[os].readText;
export const writeText = clipboards[os].writeText;
