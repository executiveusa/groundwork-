import http from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { crawlSite } from "../src/crawl.js"
import { technicalChecks } from "../src/technical.js"

const pages: Record<string, string> = {
  "/": `<html lang="en"><head><title>Fixture Org: youth mentoring in Tacoma</title><meta name="description" content="Fixture Org pairs teens with mentors in Tacoma and runs a paid summer program for sixteen to nineteen year olds."><meta name="viewport" content="width=device-width"></head><body><h1>Fixture</h1><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/donate">Donate</a><form method="get"><input name="email"></form></body></html>`,
  "/about": `<html><head><title>About</title></head><body><h1>About</h1><h1>Twice</h1><img src="x.png"></body></html>`,
  "/privacy": `<html lang="en"><head><title>Privacy policy for Fixture</title></head><body><h1>Privacy</h1></body></html>`,
  "/robots.txt": "User-agent: *\nDisallow: /",
}
let server: http.Server
let base = ""
beforeAll(async () => {
  process.env.AUDIT_ALLOW_LOCAL = "1"
  server = http.createServer((req, res) => {
    const body = pages[req.url ?? "/"]
    if (!body) { res.writeHead(404); res.end("no"); return }
    res.writeHead(200, { "content-type": req.url === "/robots.txt" ? "text/plain" : "text/html" })
    res.end(body)
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => { server.close(); delete process.env.AUDIT_ALLOW_LOCAL })

describe("crawl + technical checks end to end", () => {
  it("crawls, follows links and flags real problems", async () => {
    const c = await crawlSite(base + "/", 10)
    expect(c.pages.map((p) => new URL(p.url).pathname).sort()).toEqual(["/", "/about", "/privacy"])
    const t = technicalChecks(c)
    const failed = t.filter((x) => !x.ok).map((x) => x.id)
    expect(failed).toContain("robots-blocks-all")
    expect(failed).toContain("h1:/about")
    expect(failed).toContain("alt:/about")
    expect(failed.some((id) => id.startsWith("form-get"))).toBe(true)
    expect(t.find((x) => x.id === "privacy-link")?.ok).toBe(true)
  })
})
