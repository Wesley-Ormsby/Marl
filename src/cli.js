#!/usr/bin/env node
import { marl } from "./marl.js"
import fs from "fs";
import { resolve } from "path";

const [, , filepath] = process.argv;

const absPath = resolve(process.cwd(), filepath);
if(filepath.split(".")[1] != "marl" && filepath.split(".")[1] != "txt") {
  console.log("\x1b[1m\x1b[31mError: Invalid file extension. File must be '.marl' or '.txt'")
} else {
  fs.readFile(absPath, "utf8", function (err, data) {
    if (err) {
      console.log(`x1b[1m\x1b[31mError: File '${filepath}' does not exist`)
    } else {
      marl(data);
    }
  });
}
