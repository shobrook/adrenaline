import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import * as Diff from "diff";

import { OLD_CODE_LABEL, NEW_CODE_LABEL, CODE_SEPARATOR } from "./constants";

export function range(size, startAt = 0) { return [...Array(size).keys()].map(i => i + startAt); }

export function diffCode(oldCode, newCode) {
  const diffResults = Diff.diffArrays(oldCode, newCode);

  let mergedCode = []; let diffs = [];
  let i = 0; let j = -1;
  let currDiffId = 0;
  while (i < diffResults.length) {
    let diffResult = diffResults[i];
    let numLinesChanged = diffResult.value.length;
    let diff = { id: currDiffId, oldLines: [], mergeLine: -1, newLines: [] }

    // Assumes deletions always come before insertions
    if (diffResult.removed) {
      mergedCode.push(OLD_CODE_LABEL); j += 1;
      diff.oldLines.push(j);

      diff.oldLines.push(...range(numLinesChanged, j + 1));
      mergedCode.push(...diffResult.value); j += numLinesChanged;

      mergedCode.push(CODE_SEPARATOR); j += 1;
      diff.mergeLine = j;

      if (i < diffResults.length - 1 && diffResults[i + 1].added) { // Deletion with an insertion
        diff.newLines.push(...range(diffResults[i + 1].value.length, j + 1));
        mergedCode.push(...diffResults[i + 1].value); j += diffResults[i + 1].value.length;

        i += 2;
      } else { // Deletion with no insertion
        i += 1;
      }

      mergedCode.push(NEW_CODE_LABEL); j += 1;
      diff.newLines.push(j);

      diffs.push(diff);
      currDiffId++;

      continue;
    } else if (diffResult.added) { // Insertion with no deletion
      mergedCode.push(OLD_CODE_LABEL); j += 1;
      diff.oldLines.push(j);

      mergedCode.push(CODE_SEPARATOR); j += 1;
      diff.mergeLine = j;

      diff.newLines.push(...range(numLinesChanged + 1, j + 1));
      mergedCode.push(...diffResult.value); j += numLinesChanged;
      mergedCode.push(NEW_CODE_LABEL); j += 1;

      diffs.push(diff);
      currDiffId++;
    } else { // No deletion or insertion
      mergedCode.push(...diffResult.value); j += numLinesChanged;
    }

    i += 1;
  };

  // Excludes whitespace edits
  diffs = diffs.filter(diff => {
    const { oldLines, newLines } = diff;
    const trimmedOldLines = oldLines.join("\n").trim().replace("    ", "\t");
    const trimmedNewLines = newLines.join("\n").trim().replace("    ", "\t");

    return trimmedOldLines !== trimmedNewLines;
  });

  return {
    diffs,
    mergedCode
  };
}

export function updateDiffIndexing(diffs, updateData) {
  const { from, text, to } = updateData;

  if (from.line === to.line) { // Insertion
    let insertLine = from.line;
    let numLinesAdded = text.length - 1;

    diffs.forEach(diff => {
      const { oldLines, mergeLine, newLines } = diff;
      const lastLineInDiff = newLines.at(-1);

      // Insertions don't affect diffs *before* the insertLine
      if (lastLineInDiff < insertLine) {
        return;
      }

      if (oldLines.includes(insertLine)) { // Change occurred in old code
        let lastOldLine = oldLines.at(-1)
        diff.oldLines.push(...range(numLinesAdded, lastOldLine + 1));

        diff.mergeLine += numLinesAdded;
        diff.newLines = newLines.map(line => line + numLinesAdded);
      } else if (mergeLine === insertLine || newLines.includes(insertLine)) { // Change occurred in new code
        let lastNewLine = newLines.at(-1);
        diff.newLines.push(...range(numLinesAdded, lastNewLine + 1))
      } else { // Change occurred outside of diff
        diff.oldLines = oldLines.map(line => line + numLinesAdded);
        diff.mergeLine += numLinesAdded;
        diff.newLines = newLines.map(line => line + numLinesAdded);
      }
    });
  } else if (from.line < to.line) { // Deletion
    let deleteLine = to.line;
    let numLinesDeleted = to.line - from.line;

    diffs.forEach(diff => {
      const { oldLines, mergeLine, newLines } = diff;
      const lastLineInDiff = newLines.at(-1);

      // Deletions don't affect diffs *before* the deleteLine
      if (lastLineInDiff < deleteLine) {
        return;
      }

      if (oldLines.includes(deleteLine)) { // Change occurred in old code
        let deleteStartIndex = oldLines.indexOf(from.line);
        let deleteEndIndex = oldLines.indexOf(to.line);

        diff.oldLines = oldLines.map((line, index) => {
          if (index > deleteEndIndex) {
            return line - numLinesDeleted;
          }

          return line;
        });

        if (deleteStartIndex === -1) {
          diff.oldLines.splice(0, deleteEndIndex + 1);
        } else {
          diff.oldLines.splice(deleteStartIndex + 1, deleteEndIndex - deleteStartIndex);
        }

        diff.mergeLine -= numLinesDeleted;
        diff.newLines = newLines.map(line => line - numLinesDeleted);
      } else if (mergeLine === deleteLine) {
        // TODO: Delete entire diff if merge line is deleted
        return;
      } else if (newLines.includes(deleteLine)) { // Change occurred in new code
        let deleteStartIndex = newLines.indexOf(from.line);
        let deleteEndIndex = newLines.indexOf(to.line);

        diff.newLines = newLines.map((line, index) => {
          if (index > deleteEndIndex) {
            return line - numLinesDeleted;
          }

          return line;
        });

        if (deleteStartIndex === -1) { // Deletion extends beyond merge line
          diff.newLines.splice(0, deleteEndIndex + 1);
          // TODO: Delete entire diff if merge line is deleted
        } else {
          diff.newLines.splice(deleteStartIndex + 1, deleteEndIndex - deleteStartIndex);
        }
      } else { // Change occurred outside of diff
        diff.oldLines = oldLines.map(line => line - numLinesDeleted);
        diff.mergeLine -= numLinesDeleted;
        diff.newLines = newLines.map(line => line - numLinesDeleted);
      }
    });
  }
}

export function buildTreeFromFlatList(flatListArray) {
    if (!flatListArray) {
        return [];
    }

    let result = [];
    let level = {result};

    flatListArray.forEach(path => {
        path.split('/').reduce((r, name) => {
            if(!r[name]) {
                r[name] = {result: []};
                r.result.push({name, path, children: r[name].result})
            }

            return r[name];
            }, level)
    })

    return result;
}

export function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();

    return (
      <Component
        {...props}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}
