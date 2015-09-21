/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

/**
 * Tests that the tree model calculates correct costs/percentages for
 * allocation frame nodes. Inverted version of test_tree-model-allocations-01.js
 */

function run_test() {
  run_next_test();
}

add_task(function () {
  let { ThreadNode } = require("devtools/performance/tree-model");
  const { getProfileThreadFromAllocations } = require("devtools/toolkit/performance/utils");
  let allocationData = getProfileThreadFromAllocations(TEST_DATA);
  let thread = new ThreadNode(allocationData, { invertTree: true, startTime: 0, endTime: 1000 });

  /**
   * Values are in order according to:
   * +-------------+------------+-------------+-------------+------------------------------+
   * | Self Bytes  | Self Count | Total Bytes | Total Count | Function                     |
   * +-------------+------------+-------------+-------------+------------------------------+
   * | 1790272 41% | 8307   17% | 1790372 42% | 8317    18% | V someFunc @ a.j:345:6       |
   * |     100  1% | 10      1% |     100  1% |   10     1% |   > callerFunc @ b.j:765:34  |
   * +-------------+------------+-------------+-------------+------------------------------+
   */
  [
    [700, 70, 1, 33, 700, 70, 1, 33, "z (C:5:6)", [
      [0, 0, 0, 0, 700, 70, 1, 33, "y (B:3:4)", [
        [0, 0, 0, 0, 700, 70, 1, 33, "x (A:1:2)"]
      ]]
    ]],
    [200, 20, 1, 33, 200, 20, 1, 33, "y (B:3:4)", [
      [0, 0, 0, 0, 200, 20, 1, 33, "x (A:1:2)"]
    ]],
    [100, 10, 1, 33, 100, 10, 1, 33, "x (A:1:2)"]
  ].forEach(compareFrameInfo(thread));
});

function compareFrameInfo (root, parent) {
  parent = parent || root;
  let fields = [
    "selfSize", "selfSizePercentage", "selfCount", "selfCountPercentage",
    "totalSize", "totalSizePercentage", "totalCount", "totalCountPercentage"
  ];

  return function (def) {
    let children;

    if (Array.isArray(def[def.length - 1])) {
      children = def.pop();
    }

    let name = def.pop();
    let expected = def;

    let node = getFrameNodePath(parent, name);
    let data = node.getInfo({ root, allocations: true });

    fields.forEach((field, i) => {
      let actual = data[field];
      if (/percentage/i.test(field)) {
        actual = Number.parseInt(actual, 10);
      }
      equal(actual, expected[i], `${name} has correct ${field}: ${expected[i]}`);
    });

    if (children) {
      children.forEach(compareFrameInfo(root, node));
    }
  }
}

var TEST_DATA = {
  sites: [0, 1, 2, 3],
  timestamps: [0, 150, 200, 250],
  sizes: [0, 100, 200, 700],
  frames: [{
      source: "(root)"
    }, {
      source: "A",
      line: 1,
      column: 2,
      functionDisplayName: "x",
      parent: 0
    }, {
      source: "B",
      line: 3,
      column: 4,
      functionDisplayName: "y",
      parent: 1
    }, {
      source: "C",
      line: 5,
      column: 6,
      functionDisplayName: "z",
      parent: 2
    }
  ]
};
