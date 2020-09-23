/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * @fileoverview
 * This script builds the sxg minified AMP runtime.
 * This is run during the CI stage = build; job = sxg dist.
 */

const colors = require('ansi-colors');
const {
  printChangeSummary,
  startTimer,
  stopTimer,
  stopTimedJob,
  timedExecOrDie: timedExecOrDieBase,
  uploadSxgDistOutput,
  downloadSxgDistOutput,
} = require('./utils');
const {determineBuildTargets} = require('./build-targets');
const {isTravisPullRequestBuild} = require('../common/travis');
const {runYarnChecks} = require('./yarn-checks');

const FILENAME = 'sxg-dist.js';
const FILELOGPREFIX = colors.bold(colors.yellow(`${FILENAME}:`));
const timedExecOrDie = (cmd) => timedExecOrDieBase(cmd, FILENAME);

function main() {
  const startTime = startTimer(FILENAME, FILENAME);
  if (!runYarnChecks(FILENAME)) {
    stopTimedJob(FILENAME, startTime);
    return;
  }

  if (!isTravisPullRequestBuild()) {
    downloadSxgDistOutput(FILENAME);
  } else {
    printChangeSummary(FILENAME);
    const buildTargets = determineBuildTargets(FILENAME);
    if (buildTargets.has('RUNTIME') || buildTargets.has('FLAG_CONFIG')) {
      timedExecOrDie('gulp update-packages');
      timedExecOrDie('gulp dist --sxg --fortesting');
      uploadSxgDistOutput(FILENAME);
    } else {
      console.log(
        `${FILELOGPREFIX} Skipping`,
        colors.cyan('SXG Dist'),
        'because this commit does not affect the runtime or flag configs.'
      );
    }
  }

  stopTimer(FILENAME, FILENAME, startTime);
}

main();
