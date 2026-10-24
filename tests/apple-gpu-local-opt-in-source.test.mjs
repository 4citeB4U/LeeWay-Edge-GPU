import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../native/apple/LeeWayGPUApple/Sources/LeeWayGPUAppleApp.swift",import.meta.url),"utf8");
test("GPU opt-in defaults OFF and persists within the application",()=>{
 assert.match(src,/@AppStorage\("leeway\.apple\.gpu\.localOptIn\.v1"\)\s+private var localOptIn = false/);
 assert.match(src,/Toggle\("Use LeeWay GPU for this app", isOn: \$localOptIn\)/);
});
test("Metal readback is only invoked from an opt-in gated action",()=>{
 assert.match(src,/private func runLocalMetalProbe\(\)\s*\{\s*guard localOptIn else\s*\{[\s\S]*?return\s*\}[\s\S]*?report = MetalReadback\.execute\(\)/);
 assert.match(src,/Button\("Run native Metal probe"\)\s*\{ runLocalMetalProbe\(\) \}/);
});
test("small neural demonstration is only invoked from opt-in gated action",()=>{
 assert.match(src,/private func runTinyLocalModel\(\)\s*\{\s*guard localOptIn else\s*\{[\s\S]*?return\s*\}[\s\S]*?report = TinyModelInference\.run\(\)/);
 assert.match(src,/Button\("Run tiny local neural model"\)\s*\{ runTinyLocalModel\(\) \}/);
});
test("turning toggle OFF clears previously displayed result",()=>{
 assert.match(src,/\.onChange\(of: localOptIn\)[\s\S]*?if !enabled\s*\{[\s\S]*?report = "NOT_EXECUTED:/);
});
test("UI admits it does not redirect third-party applications",()=>{
 assert.match(src,/Third-party apps: NOT CONNECTED/);
 assert.match(src,/does not redirect other apps or replace Apple's GPU driver/);
});
