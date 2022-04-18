/*****************************************
 * 定数
 *****************************************/
// マスの状態
SQUARE_STATUS_IS_OWNED = "01"; // 自身が所有している
SQUARE_STATUS_IS_OTHER = "02"; // 他者が所有している
SQUARE_STATUS_NOT_SELECTED = "09"; // 選択されていない

/*****************************************
 * アプリケーション設定
 *****************************************/
// トースターのオプション設定
toastr.options = {
  onclick: null,
  timeOut: 0,
  extendedTimeOut: 0,
};

// ターンを示す変数
let oddTurn = true;

/*****************************************
 * イベント設定
 *****************************************/
$(function () {
  // 初期化ボタンを押したときのイベント
  $("#btn-initialize").click(initializeEvent);

  // マスをクリックしたときのイベント
  $(".square").click(function () {
    if (!canSelect($(this))) {
      return;
    }
    clickSquareEvent($(this));
  });

  // 盤面を初期化する
  initializeEvent();
});

/**
 * マス目クリックイベント
 * @param {選択されたマス目オブジェクト} $square
 */
function clickSquareEvent($square) {
  // ターン表示を削除する
  toastr.remove();

  // 選択されたマスの色を変更する
  changeOwner($square);

  // ゲーム終了
  if (isGameEnd()) {
    toastEndMessage("ゲームが終了しました。");
    return;
  }

  // 次のターンに選択できるマスが存在しない場合
  if (isPath()) {
    // エラーメッセージを表示する
    toastr.remove();
    toastr.error(getTurnString() + "には選択できるマスがありません。");

    // 次のターンに変更する
    changeTurn();
    if (!isPath()) {
      setTimeout(function () {
        toastr.info(getTurnString() + "の番です。");
      }, 1000);
    } else {
      toastr.error(getTurnString() + "には選択できるマスがありません。");
      toastEndMessage("選択できるマスがなくなりました。");
    }

    return;
  }

  // 次のターンを示すメッセージを表示する
  toastr.info(getTurnString() + "の番です。");
}

/**
 * 盤面初期化イベント
 */
function initializeEvent() {
  // トースターを非表示にする
  toastr.remove();

  // マスの属性をリセットする
  $(".square")
    .text("")
    .removeClass("selected")
    .removeClass("cant-select")
    .removeClass("can-select")
    .attr("data-owner", "");

  // 奇数番手に戻す
  oddTurn = true;

  // 初期値設定
  changeOwner(getTargetSquare(3, 3));
  changeOwner(getTargetSquare(3, 4));
  changeOwner(getTargetSquare(4, 4));
  changeOwner(getTargetSquare(4, 3));

  // トースターを表示する
  toastr.info(getTurnString() + "の番です。");
}

/**
 * ゲーム終了メッセージを表示する
 */
function toastEndMessage(message) {
  let countBlack = $("[data-owner=black]").length;
  let countWhite = $("[data-owner=white]").length;

  let judgeString =
    "black:" + countBlack + "<br/>" + "white:" + countWhite + "<br/>";

  // メッセージを表示する
  if (countBlack == countWhite) {
    toastr.success(message + "<br/>" + judgeString + "引き分けです。");
  } else if (countBlack < countWhite) {
    toastr.success(message + "<br/>" + judgeString + "whiteの勝利です。");
  } else {
    toastr.success(message + "<br/>" + judgeString + "blackの勝利です。");
  }
}

/*****************************************
 * 内部関数
 *****************************************/
/**
 * マス目の所有者を変更する
 * @param {選択されたマス目} $square
 */
function changeOwner($square) {
  // 選択したマスにピースを設置する
  changeTargetOwner($square.data("row"), $square.data("col"), getTurnString());

  // 隣接するピースを反転する
  changeOwnerOpposite($square);

  // ターンを変更する
  changeTurn();
}

/**
 * ターンを変更する
 */
function changeTurn() {
  // ターンを変更する
  oddTurn = !oddTurn;

  // 選択可否を設定する
  $(".square").removeClass("can-select");
  $(".square").addClass("cant-select");
  $(".square").each(function (index, elem) {
    if (canSelect($(elem))) {
      $(elem).addClass("can-select");
      $(elem).removeClass("cant-select");
    }
  });
}

/**
 * 指定されたマス目が選択できるか判定する
 * @param {マス目} $square
 * @returns 選択できる場合true
 */
function canSelect($square) {
  // 既にピースが設定されている場合は選択不可
  if ($square.hasClass("selected")) {
    return false;
  }

  // 各方向に対抗先が存在するか判定する
  let row = $square.data("row");
  let col = $square.data("col");
  if (getPosOppositeUpper(row, col) != null) {
    return true;
  }
  if (getPosOppositeLower(row, col) != null) {
    return true;
  }
  if (getPosOppositeLeft(row, col) != null) {
    return true;
  }
  if (getPosOppositeRight(row, col) != null) {
    return true;
  }
  if (getPosOppositeUpperLeft(row, col) != null) {
    return true;
  }
  if (getPosOppositeUpperRight(row, col) != null) {
    return true;
  }
  if (getPosOppositeLowerLeft(row, col) != null) {
    return true;
  }
  if (getPosOppositeLowerRight(row, col) != null) {
    return true;
  }

  return false;
}

/**
 * 対向の所有マスの位置を取得する(上)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeUpper(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (row == 0) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row - 1;
  let targetCol = col;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (targetRow--; 0 <= targetRow; targetRow--) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(下)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeLower(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (row == 7) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row + 1;
  let targetCol = col;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (targetRow++; targetRow < 8; targetRow++) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(左)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeLeft(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (col == 0) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (targetCol--; 0 <= targetCol; targetCol--) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(右)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeRight(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (col == 7) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (targetCol++; targetCol < 8; targetCol++) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(左上)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeUpperLeft(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (row == 0 || col == 0) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row - 1;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (
    targetRow--, targetCol--;
    0 <= targetRow, 0 <= targetCol;
    targetRow--, targetCol--
  ) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(右上)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeUpperRight(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (row == 0 || col == 7) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row - 1;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (
    targetRow--, targetCol++;
    0 <= targetRow, targetCol < 8;
    targetRow--, targetCol++
  ) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(左下)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeLowerLeft(row, col) {
  // 調査対象が最端の場合は終了する
  if (row == 7 || col == 0) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row + 1;
  let targetCol = col - 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (
    targetRow++, targetCol--;
    targetRow < 8, 0 <= targetCol;
    targetRow++, targetCol--
  ) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 対向の所有マスの位置を取得する(右下)
 *
 * @param {基準マスの行} row
 * @param {基準マスの列} col
 * @returns マスの位置を示すjsonオブジェクト
 */
function getPosOppositeLowerRight(row, col) {
  // 基準マスが最端の場合は対抗先が存在しない
  if (row == 7 || col == 7) {
    return null;
  }

  // 隣接マスが他者所有ではない場合は対抗先が存在しない
  let targetRow = row + 1;
  let targetCol = col + 1;
  if (getSquareStatus(targetRow, targetCol) != SQUARE_STATUS_IS_OTHER) {
    return null;
  }

  // 連続する異色ピースを判定する
  for (
    targetRow++, targetCol++;
    targetRow < 8, targetCol < 8;
    targetRow++, targetCol++
  ) {
    // マスの状態を取得する
    let squareType = getSquareStatus(targetRow, targetCol);

    // 選択されていないマスに到達した場合は終了する
    if (squareType == SQUARE_STATUS_NOT_SELECTED) {
      return null;
    }

    // 自身の所有マスに到達した場合、位置を返却する
    if (squareType == SQUARE_STATUS_IS_OWNED) {
      return {
        row: targetRow,
        col: targetCol,
      };
    }
  }
  return null;
}

/**
 * 調査対象のマス目が現在のターンの所有かどうかを判定する
 * @param {行} row
 * @param {列} col
 * @returns 定数-マスの状態
 */
function getSquareStatus(row, col) {
  // マスを取得する
  let $targetSquare = getTargetSquare(row, col);

  // 未選択状態を判定する
  if (!$targetSquare.hasClass("selected")) {
    return SQUARE_STATUS_NOT_SELECTED;
  }

  // 自身の所有状態を判定する
  if (getTurnString() == $targetSquare.attr("data-owner")) {
    return SQUARE_STATUS_IS_OWNED;
  }

  // 他者の所有状態
  return SQUARE_STATUS_IS_OTHER;
}

/**
 * マスを選択する
 * @param {マス目オブジェクト} $square
 */
function changeOwnerOpposite($square) {
  // 指定されたマスを基準位置として設定する
  row = $square.data("row");
  col = $square.data("col");

  // 所有者を変更する
  changeOwnerOppositeUpper(row, col);
  changeOwnerOppositeLower(row, col);
  changeOwnerOppositeLeft(row, col);
  changeOwnerOppositeRight(row, col);
  changeOwnerOppositeUpperLeft(row, col);
  changeOwnerOppositeUpperRight(row, col);
  changeOwnerOppositeLowerLeft(row, col);
  changeOwnerOppositeLowerRight(row, col);
}

/**
 * 所有者を変更する(上)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeUpper(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeUpper(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  let targetCol = col;
  for (targetRow = row - 1; endPos.row < targetRow; targetRow--) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(下)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeLower(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeLower(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  let targetCol = col;
  for (targetRow = row + 1; targetRow < endPos.row; targetRow++) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(左)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeLeft(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeLeft(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  let targetRow = row;
  for (targetCol = col - 1; endPos.col < targetCol; targetCol--) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(右)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeRight(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeRight(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  let targetRow = row;
  for (targetCol = col + 1; targetCol < endPos.col; targetCol++) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(左上)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeUpperLeft(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeUpperLeft(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row - 1, targetCol = col - 1;
    endPos.row < targetRow, endPos.col < targetCol;
    targetRow--, targetCol--
  ) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(右上)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeUpperRight(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeUpperRight(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row - 1, targetCol = col + 1;
    endPos.row < targetRow, targetCol < endPos.col;
    targetRow--, targetCol++
  ) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(左下)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeLowerLeft(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeLowerLeft(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row + 1, targetCol = col - 1;
    targetRow < endPos.row, endPos.col < targetCol;
    targetRow++, targetCol--
  ) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 所有者を変更する(右下)
 * @param {基準マスの列} row
 * @param {基準マスの行} col
 */
function changeOwnerOppositeLowerRight(row, col) {
  // 対抗先を取得する
  let endPos = getPosOppositeLowerRight(row, col);
  if (endPos == null) {
    return;
  }

  // 対抗先まで所有者を変更する
  for (
    targetRow = row + 1, targetCol = col + 1;
    targetRow < endPos.row, targetCol < endPos.col;
    targetRow++, targetCol++
  ) {
    changeTargetOwner(targetRow, targetCol, getTurnString());
  }
}

/**
 * 指定位置のマス目オブジェクトを取得する
 * @param {行} row
 * @param {列} col
 * @returns 指定位置のマス目オブジェクト
 */
function getTargetSquare(row, col) {
  return $("[data-row=" + row + "][data-col=" + col + "]");
}

/**
 * マスのオーナーを変更する
 * @param {行} row
 * @param {列} col
 * @param {所有者を示す文字列(black or white)} owner
 */
function changeTargetOwner(row, col, owner) {
  $targetSquare = $("[data-row=" + row + "][data-col=" + col + "]");
  $targetSquare.text("●").addClass("selected").attr("data-owner", owner);
}

/**
 * ターンを示す文字列を取得する
 * @returns ターンを示す文字列
 */
function getTurnString() {
  if (oddTurn) {
    return "black";
  }
  return "white";
}

/**
 * 番手がパスかどうかを判定する
 * @returns boolean パスの場合はtrue
 */
function isPath() {
  if ($(".square.can-select").length == 0) {
    return true;
  }
  return false;
}

/**
 * ゲーム終了を判定する
 * @returns boolean ゲーム終了状態の場合はtrue
 */
function isGameEnd() {
  if ($(".square.selected").length == 64) {
    return true;
  }
  return false;
}
