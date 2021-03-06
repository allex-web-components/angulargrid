(function(){
  'use strict';

  angular.module('ui.grid').directive('uiGridViewport', ['gridUtil','ScrollEvent','uiGridConstants', '$log',
    function(gridUtil, ScrollEvent, uiGridConstants, $log) {

      function scrollHandler($elm, grid, containerCtrl, $scope, evt) {
        //Leaving in this commented code in case it can someday be used
        //It does improve performance, but because the horizontal scroll is normalized,
        //  using this code will lead to the column header getting slightly out of line with columns
        //
        //if (ignoreScroll && (grid.isScrollingHorizontally || grid.isScrollingHorizontally)) {
        //  //don't ask for scrollTop if we just set it
        //  ignoreScroll = false;
        //  return;
        //}
        //ignoreScroll = true;

        var rowContainer = containerCtrl.rowContainer;
        var colContainer = containerCtrl.colContainer;

        var newScrollTop = $elm[0].scrollTop;
        var newScrollLeft = gridUtil.normalizeScrollLeft($elm, grid);

        var vertScrollPercentage = rowContainer.scrollVertical(newScrollTop);
        var horizScrollPercentage = colContainer.scrollHorizontal(newScrollLeft);

        var scrollEvent = new ScrollEvent(grid, rowContainer, colContainer, ScrollEvent.Sources.ViewPortScroll);
        scrollEvent.newScrollLeft = newScrollLeft;
        scrollEvent.newScrollTop = newScrollTop;
        if ( horizScrollPercentage > -1 ){
          scrollEvent.x = { percentage: horizScrollPercentage };
        }

        if ( vertScrollPercentage > -1 ){
          scrollEvent.y = { percentage: vertScrollPercentage };
        }

        grid.scrollContainers($scope.$parent.containerId, scrollEvent);
      }

      function syncVerticalScroll($elm, containerCtrl, scrollEvent){
        containerCtrl.prevScrollArgs = scrollEvent;
        var newScrollTop = scrollEvent.getNewScrollTop(containerCtrl.rowContainer,containerCtrl.viewport);
        $elm[0].scrollTop = newScrollTop;
      }

      function syncHorizontalScroll($elm, grid, containerCtrl, scrollEvent){
        containerCtrl.prevScrollArgs = scrollEvent;
        var newScrollLeft = scrollEvent.getNewScrollLeft(containerCtrl.colContainer, containerCtrl.viewport);
        $elm[0].scrollLeft =  gridUtil.denormalizeScrollLeft(containerCtrl.viewport,newScrollLeft, grid);
      }

      function syncHorizontalHeader(scrollEvent, grid, containerCtrl){
        var newScrollLeft = scrollEvent.getNewScrollLeft(containerCtrl.colContainer, containerCtrl.viewport);
        if (containerCtrl.headerViewport) {
          containerCtrl.headerViewport.scrollLeft = gridUtil.denormalizeScrollLeft(containerCtrl.viewport,newScrollLeft, grid);
        }
      }

      function syncHorizontalFooter(scrollEvent, grid, containerCtrl){
        var newScrollLeft = scrollEvent.getNewScrollLeft(containerCtrl.colContainer, containerCtrl.viewport);
        if (containerCtrl.footerViewport) {
          containerCtrl.footerViewport.scrollLeft =  gridUtil.denormalizeScrollLeft(containerCtrl.viewport,newScrollLeft, grid);
        }
      }
      function getRowStyle ($scope, index) {
        var rowContainer = $scope.rowContainer;
        var colContainer = $scope.colContainer;

        var styles = {};

        if (index === 0 && rowContainer.currentTopRow !== 0) {
          // The row offset-top is just the height of the rows above the current top-most row, which are no longer rendered
          var hiddenRowWidth = (rowContainer.currentTopRow) * rowContainer.grid.options.rowHeight;

          // return { 'margin-top': hiddenRowWidth + 'px' };
          styles['margin-top'] = hiddenRowWidth + 'px';
        }

        if (colContainer.currentFirstColumn !== 0) {
          if (colContainer.grid.isRTL()) {
            styles['margin-right'] = colContainer.columnOffset + 'px';
          }
          else {
            styles['margin-left'] = colContainer.columnOffset + 'px';
          }
        }

        return styles;
      }

      return {
        replace: true,
        scope: {},
        controllerAs: 'Viewport',
        templateUrl: 'ui-grid/uiGridViewport',
        require: ['^uiGrid', '^uiGridRenderContainer'],
        link: function($scope, $elm, $attrs, controllers) {
          // gridUtil.logDebug('viewport post-link');

          var uiGridCtrl = controllers[0];
          var containerCtrl = controllers[1];

          $scope.containerCtrl = containerCtrl;

          var rowContainer = containerCtrl.rowContainer;
          var colContainer = containerCtrl.colContainer;

          var grid = uiGridCtrl.grid;

          $scope.grid = uiGridCtrl.grid;

          // Put the containers in scope so we can get rows and columns from them
          $scope.rowContainer = containerCtrl.rowContainer;
          $scope.colContainer = containerCtrl.colContainer;

          // Register this viewport with its container
          containerCtrl.viewport = $elm;

          $elm.on('scroll', scrollHandler.bind(null, $elm, grid, containerCtrl, $scope));

          var ignoreScroll = false;

          if ($scope.$parent.bindScrollVertical) {
            grid.addVerticalScrollSync($scope.$parent.containerId, syncVerticalScroll.bind(null, $elm, containerCtrl));
          }

          if ($scope.$parent.bindScrollHorizontal) {
            grid.addHorizontalScrollSync($scope.$parent.containerId, syncHorizontalScroll.bind(null, $elm, grid, containerCtrl));
            grid.addHorizontalScrollSync($scope.$parent.containerId + 'header', syncHorizontalHeader.bind(null, grid, containerCtrl));
            grid.addHorizontalScrollSync($scope.$parent.containerId + 'footer', syncHorizontalFooter.bind(null, grid, containerCtrl));
          }
        },
        controller: ['$scope', function ($scope) {
          this.rowStyle = getRowStyle.bind(null, $scope);
        }]
      };
    }
  ]);

})();
