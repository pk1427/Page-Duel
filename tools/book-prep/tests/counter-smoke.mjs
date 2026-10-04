import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const html = await readFile(new URL("../counter.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  url: "file:///counter.html",
  pretendToBeVisual: true,
});
const { window } = dom;
const book = {
  id: "smoke",
  title: "Smoke",
  author: "A",
  coverImage: "cover.webp",
  spreads: [1, 2, 3].map((n) => ({
    id: `s${n}`,
    left: { page: n * 2, image: "left.webp", people: null },
    right: { page: n * 2 + 1, image: "right.webp", people: null },
    flags: [],
  })),
};
window.loadBook(book);
const input = (id) => window.document.getElementById(id);
assert.match(input("indicator").textContent, /Spread s1/);
assert.match(input("indicator").textContent, /printed pages 2–3/);
input("left").value = "2";
input("left").dispatchEvent(new window.Event("change", { bubbles: true }));
input("right").value = "3";
input("right").dispatchEvent(new window.Event("change", { bubbles: true }));
assert.equal(window.__book.spreads[0].left.people, 2);
assert.equal(window.__book.spreads[0].right.people, 3);
assert.equal(window.document.getElementById("progress").value, 1);
input("notes").value = "Tenniel crowd";
input("notes").dispatchEvent(new window.Event("change", { bubbles: true }));
input("ambiguous").checked = true;
input("ambiguous").dispatchEvent(new window.Event("change", { bubbles: true }));
assert.equal(window.__book.spreads[0].notes, "Tenniel crowd");
assert.deepEqual(Array.from(window.__book.spreads[0].flags), ["ambiguous"]);
window.document.getElementById("next-uncounted").click();
assert.match(input("indicator").textContent, /Spread s2/);
window.document.getElementById("previous").click();
assert.match(input("indicator").textContent, /Spread s1/);
assert.equal(input("notes").value, "Tenniel crowd");
const exported = JSON.parse(window.exportBookJson(window.__book));
assert.equal(exported.spreads[0].left.people, 2);
assert.equal(typeof exported.spreads[0].left.people, "number");
assert.equal(exported.spreads[0].notes, "Tenniel crowd");
assert.equal(exported.spreads[1].left.people, null);
window.document.getElementById("next").click();
input("left").value = "-1";
input("left").dispatchEvent(new window.Event("change", { bubbles: true }));
assert.equal(JSON.parse(window.exportBookJson(window.__book)).spreads[1].left.people, null);
window.__book.spreads[2].flags = ["excluded"];
assert.deepEqual(JSON.parse(window.exportBookJson(window.__book)).spreads[2].flags, ["excluded"]);
console.log("counter smoke: ok");
