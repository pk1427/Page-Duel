import { describe, expect, it } from "vitest";
import { isProtectedRoute, playTarget, resolveNextParam } from "../src/auth-routing";

describe("isProtectedRoute", () => {
  it("protects gameplay, setup, results, and profile routes", () => {
    for (const route of ["/books", "/setup", "/game", "/result", "/profile"]) {
      expect(isProtectedRoute(route)).toBe(true);
    }
  });
  it("leaves home, how-to-play, and auth routes public", () => {
    for (const route of ["/", "/how-to-play", "/sign-in", "/sign-up", "", null, undefined]) {
      expect(isProtectedRoute(route)).toBe(false);
    }
  });
  it("ignores query strings and fragments", () => {
    expect(isProtectedRoute("/game?round=3")).toBe(true);
    expect(isProtectedRoute("/books#shelf")).toBe(true);
    expect(isProtectedRoute("/?next=/books")).toBe(false);
  });
});

describe("resolveNextParam", () => {
  it("accepts the bookshelf destination", () => {
    expect(resolveNextParam("/books")).toBe("/books");
    expect(resolveNextParam(["/books"])).toBe("/books");
  });
  it("falls back to the bookshelf for missing or unsafe values", () => {
    expect(resolveNextParam(undefined)).toBe("/books");
    expect(resolveNextParam("/profile")).toBe("/books");
    expect(resolveNextParam("https://evil.example/books")).toBe("/books");
    expect(resolveNextParam("//books")).toBe("/books");
    expect(resolveNextParam([])).toBe("/books");
  });
});

describe("playTarget", () => {
  it("sends signed-in users straight to the shelf", () => {
    expect(playTarget("signed-in")).toEqual({ pathname: "/books" });
  });
  it("sends everyone else through sign-in with a safe return", () => {
    for (const status of ["loading", "signed-out", "unconfigured"] as const) {
      expect(playTarget(status)).toEqual({ pathname: "/sign-in", params: { next: "/books" } });
    }
  });
});
