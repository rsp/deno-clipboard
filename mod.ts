type Dispatch = {
  [key in Deno.OperatingSystem]: Clipboard;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const encode = (x: string) => encoder.encode(x);
export const decode = (x: Uint8Array) => decoder.decode(x);

const opt: Deno.RunOptions = {
  args: [],
  stdin: 'piped',
  stdout: 'piped',
  stderr: 'piped',
};

async function read(args: string[]): Promise<string> {
  const p = Deno.run({ ...opt, args });
  return decode(await p.output());
}

async function write(args: string[], data: string): Promise<void> {
  const p = Deno.run({ ...opt, args });
  await p.stdin.write(encode(data));
  p.stdin.close();
  await p.status();
}

const linux: Clipboard = {
  os: 'linux',
  async readText() {
    return read(['xclip', '-b', '-o']);
  },
  async writeText(data) {
    return write(['xclip', '-b'], data);
  },
};

const mac: Clipboard = {
  os: 'mac',
  async readText() {
    return read(['pbpaste']);
  },
  async writeText(data) {
    return write(['pbcopy'], data);
  },
};

const win: Clipboard = {
  os: 'win',
  async readText() {
    return read(['powershell', '-noprofile', '-command', 'Get-Clipboard']);
  },
  async writeText(data) {
    return write(['powershell', '-noprofile', '-command', '$input|Set-Clipboard'], data);
  },
};

const dispatch: Dispatch = {
  linux,
  mac,
  win,
};

class Clipboard {
  os: Deno.OperatingSystem;
  constructor(os: Deno.OperatingSystem) {
    if (!dispatch[os]) {
      throw new Error(`Clipboard: unsupported OS: ${os}`);
    }
    this.os = os;
  }
  async readText(): Promise<string> {
    return dispatch[this.os].readText();
  }
  async writeText(data: string): Promise<void> {
    return dispatch[this.os].writeText(data);
  }
}

export const clipboard = new Clipboard(Deno.build.os);
