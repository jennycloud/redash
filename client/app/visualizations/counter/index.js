import numberFormat from 'underscore.string/numberFormat';
import { keys, isNumber as isNum } from 'underscore';

import counterTemplate from './counter.html';
import counterEditorTemplate from './counter-editor.html';

function getRowNumber(index, size) {
  if (index >= 0) {
    return index - 1;
  }

  if (Math.abs(index) > size) {
    index %= size;
  }

  return size + index;
}

const DEFAULT_COMPARATOR_VALUE = 'Greater Than'

const comparatorTable = {
  [DEFAULT_COMPARATOR_VALUE]: '>', 
  'Greater or Equal to': '>=',
  'Less Than': '<', 
  'Less Than or Equal to': '<=', 
  'Equal to': '===',
}

function performComparison(a, b, comparatorString) {
  return eval(`a ${comparatorTable[comparatorString]} b`)
}

function CounterRenderer() {
  return {
    restrict: 'E',
    template: counterTemplate,
    link($scope) {
      const refreshData = () => {
        const queryData = $scope.queryResult.getData();
        if (queryData) {
          const rowNumber = getRowNumber($scope.visualization.options.rowNumber, queryData.length);
          const targetRowNumber =
            getRowNumber($scope.visualization.options.targetRowNumber, queryData.length);
          const counterColName = $scope.visualization.options.counterColName;
          const targetColName = $scope.visualization.options.targetColName;
          const targetSetValue = $scope.visualization.options.targetSetValue;
          const targetComparator = $scope.visualization.options.targetComparator;

          const targetSumColumn = $scope.visualization.options.targetSumColumn;

          if (counterColName) {
            $scope.counterValue = queryData[rowNumber][counterColName];
          }

          if (targetSumColumn) {
            const columnSum = queryData.reduce((sum, row) => sum + (+row[targetSumColumn]), 0)
            $scope.counterValue = columnSum
            console.log('the column sum', columnSum)
          }

          if ($scope.visualization.options.countRow) {
            $scope.counterValue = queryData.length;
          }

          if (targetColName) {
            $scope.targetValue = queryData[targetRowNumber][targetColName];

            if ($scope.targetValue) {
              $scope.delta = $scope.counterValue - $scope.targetValue;
              $scope.trendPositive = performComparison($scope.delta, 0, targetComparator);
            }
          } else if (targetSetValue) {
            $scope.targetValue = targetSetValue;

            $scope.delta = $scope.counterValue - $scope.targetValue;
            $scope.trendPositive = performComparison($scope.delta, 0, targetComparator);
          } else {
            $scope.targetValue = null;
          }

          $scope.isNumber = isNum($scope.counterValue);
          if ($scope.isNumber) {
            $scope.stringPrefix = $scope.visualization.options.stringPrefix;
            $scope.stringSuffix = $scope.visualization.options.stringSuffix;

            const stringDecimal = $scope.visualization.options.stringDecimal;
            const stringDecChar = $scope.visualization.options.stringDecChar;
            const stringThouSep = $scope.visualization.options.stringThouSep;
            if (stringDecimal || stringDecChar || stringThouSep) {
              $scope.counterValue = numberFormat(
                $scope.counterValue,
                stringDecimal,
                stringDecChar,
                stringThouSep,
              );
              $scope.isNumber = false;
            }
          } else {
            $scope.stringPrefix = null;
            $scope.stringSuffix = null;
          }
        }
      };

      $scope.$watch('visualization.options', refreshData, true);
      $scope.$watch('queryResult && queryResult.getData()', refreshData);
    },
  };
}

function CounterEditor() {
  return {
    restrict: 'E',
    template: counterEditorTemplate,
    link(scope) {
      scope.currentTab = 'general';
      scope.changeTab = (tab) => {
        scope.currentTab = tab;
      };
      scope.isValueNumber = () => {
        const queryData = scope.queryResult.getData();
        if (queryData) {
          const rowNumber = getRowNumber(scope.visualization.options.rowNumber, queryData.length);
          const counterColName = scope.visualization.options.counterColName;

          if (scope.visualization.options.countRow) {
            scope.counterValue = queryData.length;
          } else if (counterColName) {
            scope.counterValue = queryData[rowNumber][counterColName];
          }
        }
        return isNum(scope.counterValue);
      };

      scope.visualization.options.targetComparator = DEFAULT_COMPARATOR_VALUE

      scope.comparatorOptions = keys(comparatorTable)
      // scope.comparatorOptions = {
      //   '>': 'Greater Than',
      //   '>=': 'Greater or Equal to',
      //   '<': 'Less Than',
      //   '<=': 'Less Than or Equal to',
      //   '==': 'Equal to',
      // }
    },
  };
}


export default function init(ngModule) {
  ngModule.directive('counterEditor', CounterEditor);
  ngModule.directive('counterRenderer', CounterRenderer);

  ngModule.config((VisualizationProvider) => {
    const renderTemplate =
        '<counter-renderer ' +
        'options="visualization.options" query-result="queryResult">' +
        '</counter-renderer>';

    const editTemplate = '<counter-editor></counter-editor>';
    const defaultOptions = {
      counterColName: 'counter',
      rowNumber: 1,
      targetRowNumber: 1,
      stringDecimal: 0,
      stringDecChar: '.',
      stringThouSep: ',',
    };

    VisualizationProvider.registerVisualization({
      type: 'COUNTER',
      name: 'Counter',
      renderTemplate,
      editorTemplate: editTemplate,
      defaultOptions,
    });
  });
}
