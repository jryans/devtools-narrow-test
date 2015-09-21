/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const DevToolsUtils = require("devtools/toolkit/DevToolsUtils");
const { DevToolsWorker } = require("devtools/toolkit/shared/worker.js");

const WORKER_URL = "resource://gre/modules/devtools/heapsnapshot/HeapAnalysesWorker.js";
var workerCounter = 0;

/**
 * A HeapAnalysesClient instance provides a developer-friendly interface for
 * interacting with a HeapAnalysesWorker. This enables users to be ignorant of
 * the message passing protocol used to communicate with the worker. The
 * HeapAnalysesClient owns the worker, and terminating the worker is done by
 * terminating the client (see the `destroy` method).
 */
const HeapAnalysesClient = module.exports = function () {
  this._worker = new DevToolsWorker(WORKER_URL, {
    name: `HeapAnalyses-${workerCounter++}`,
    verbose: DevToolsUtils.dumpn.wantLogging
  });
};

/**
 * Destroy the worker, causing it to release its resources (such as heap
 * snapshots it has deserialized and read into memory). The client is no longer
 * usable after calling this method.
 */
HeapAnalysesClient.prototype.destroy = function () {
  this._worker.destroy();
};

/**
 * Tell the worker to read into memory the heap snapshot at the given file
 * path. This is a prerequisite for asking the worker to perform various
 * analyses on a heap snapshot.
 *
 * @param {String} snapshotFilePath
 *
 * @returns Promise
 *          The promise is fulfilled if the heap snapshot is successfully
 *          deserialized and read into memory. The promise is rejected if that
 *          does not happen, eg due to a bad file path or malformed heap
 *          snapshot file.
 */
HeapAnalysesClient.prototype.readHeapSnapshot = function (snapshotFilePath) {
  return this._worker.performTask("readHeapSnapshot", { snapshotFilePath });
};

/**
 * Ask the worker to perform a census analysis on the heap snapshot with the
 * given path. The heap snapshot at the given path must have already been read
 * into memory by the worker (see `readHeapSnapshot`).
 *
 * @param {String} snapshotFilePath
 *
 * @param {Object} censusOptions
 *        A structured-cloneable object specifying the requested census's
 *        breakdown. See the "takeCensus" section of
 *        `js/src/doc/Debugger/Debugger.Memory.md` for detailed documentation.
 *
 * @returns Promise<census report>
 *          The report generated by the given census breakdown.
 */
HeapAnalysesClient.prototype.takeCensus = function (snapshotFilePath,
                                                    censusOptions) {
  return this._worker.performTask("takeCensus", {
    snapshotFilePath,
    censusOptions
  });
};
