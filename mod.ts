// Copyright (c) 2019 Rafał Pocztarski. All rights reserved.
// MIT License (Expat). See: https://github.com/rsp/deno-clipboard

type OperatingSystem = typeof Deno.build.os

type Dispatch = {
  [key in OperatingSystem]: Clipboard
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const encode = (x: string) => encoder.encode(x)
export const decode = (x: Uint8Array) => decoder.decode(x)

const opt: Deno.RunOptions = {
  cmd: [],
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
}

async function read(cmd: string[]): Promise<string> {
  const p = Deno.run({ ...opt, cmd })
  return decode(await p.output())
}

async function write(cmd: string[], data: string): Promise<void> {
  const p = Deno.run({ ...opt, cmd })
  await p.stdin?.write(encode(data))
  p.stdin?.close()
  await p.status()
}

const linux: Clipboard = {
  os: "linux",
  async readText() {
    // return read(['xclip', '-selection', 'clipboard', '-o']);
    return read(["xsel", "-b", "-o"])
  },
  async writeText(data) {
    // return write(['xclip', '-selection', 'clipboard'], data);
    return write(["xsel", "-b", "-i"], data)
  },
}

const mac: Clipboard = {
  os: "darwin",
  async readText() {
    return read(["pbpaste"])
  },
  async writeText(data) {
    return write(["pbcopy"], data)
  },
}

const win: Clipboard = {
  os: "windows",
  async readText() {
    const data = await read([
      "powershell",
      "-noprofile",
      "-command",
      "Get-Clipboard",
    ])
    return data.replace(/\r/g, "").replace(/\n$/, "")
  },
  async writeText(data) {
    return write(
      ["powershell", "-noprofile", "-command", "$input|Set-Clipboard"],
      data,
    )
  },
}

const dispatch: Dispatch = {
  linux,
  darwin: mac,
  windows: win,
}

class Clipboard {
  os: OperatingSystem
  constructor(os: OperatingSystem) {
    if (!dispatch[os]) {
      throw new Error(`Clipboard: unsupported OS: ${os}`)
    }
    this.os = os
  }
  async readText(): Promise<string> {
    return dispatch[this.os].readText()
  }
  async writeText(data: string): Promise<void> {
    return dispatch[this.os].writeText(data)
  }
}

export const clipboard = new Clipboard(Deno.build.os)
