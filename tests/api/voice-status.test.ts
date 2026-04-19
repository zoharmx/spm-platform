import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/voice/status/route";

function makeReq(body: string) {
  return new Request("http://localhost/api/voice/status", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

describe("POST /api/voice/status", () => {
  it("returns 200 OK for valid callback", async () => {
    const res = await POST(makeReq(
      "CallSid=CA123&CallStatus=completed&To=%2B528100000000&Duration=45"
    ) as never);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("OK");
  });

  it("handles empty body gracefully", async () => {
    const res = await POST(makeReq("") as never);
    expect(res.status).toBe(200);
  });

  it("handles malformed body gracefully", async () => {
    const res = await POST(new Request("http://localhost/api/voice/status", {
      method: "POST",
      body: null,
    }) as never);
    expect(res.status).toBe(200);
  });
});
