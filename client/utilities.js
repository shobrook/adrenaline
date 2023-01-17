import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import * as Diff from 'diff';

export const OLD_CODE_LABEL = ">>>>>>> OLD CODE";
export const CODE_SEPARATOR = "=======";
export const FIXED_CODE_LABEL = ">>>>>>> FIXED CODE"

export const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);

export const diffGPTOutput = (inputCode, gptCode) => {
  const diffResults = Diff.diffArrays(inputCode, gptCode);

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

      mergedCode.push(FIXED_CODE_LABEL); j += 1;
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
      mergedCode.push(FIXED_CODE_LABEL); j += 1;

      diffs.push(diff);
      currDiffId++;
    } else { // No deletion or insertion
      mergedCode.push(...diffResult.value); j += numLinesChanged;
    }

    i += 1;
  };

  return {
    diffs,
    mergedCode,
  };
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
