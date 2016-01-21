YUI.add("reportal-hitlist", function(Y) {
  var _io, CONST_INIT_ONLY = "initOnly",
    CONST_MODIFY_COLUMN_ID = "___MODIFY_COLUMNS___", CONST_COLUM_CLASS_PREFIX = "yui3-datatable-col-",
    CONST_LOADING_CLASS = "loading",
    CLASS_SELECTED_ROW = "hitlist-selected-row",
    CLASS_MODIFY_COLUMNS_BUTTON = "hitlist-btn",
    CLASS_FILTER_PANEL_HIDDEN = "hitlist-dropdown-panel-hidden",
    SELECTOR_MODIFY_COLUMNS_BUTTON = "." + CONST_COLUM_CLASS_PREFIX + CONST_MODIFY_COLUMN_ID + " ." + CLASS_MODIFY_COLUMNS_BUTTON,
    SELECTOR_FILTER_PANEL = ".hitlist-dropdown-panel-fields",
    BADGE_TEMPLATE = "<div data-fieldid='{id}' class='hitlist-filter'><span class='hitlist-filter-remove'></span><span class='hitlist-filter-name'>{label}: </span><span class='hitlist-filter-value'>{value}</span></div>",
    FILTER_LABEL_TEMPLATE = "<label for='{id}_field'>{label}</label>",
    FILTER_ROW_TEMPLATE = "<div class='hitlist-filter-item' id='{id}'></div>",
    FILTER_DATE_TEMPLATE = "<select id='{id}_field'><option></option><option value='{Between}'>{between}</option><option value='{LessThanOrEqual}'>{before}</option><option value='{GreaterThanOrEqual}'>{after}</option></select>",
    FILTER_NUMERIC_TEMPLATE = "<select id='{id}_field'><option></option><option value='{Between}'>{between}</option><option value='{LessThanOrEqual}'>{stoe}</option><option value='{GreaterThanOrEqual}'>{gtoe}</option><option value='{Equal}'>{exactly}</option></select>",
    FILTER_NUMERIC_FIELDS_TEMPLATE = "<span class='val1 hitlist-toggle-field' style='display:none'><input type='text' value='{val1}' class='hitlist-filter-text-field' id='{id}_val1' /></span><span class='val2 hitlist-toggle-field' style='display:none'>&nbsp;&nbsp;-&nbsp;<input type='text' value='{val2}' class='hitlist-filter-text-field' id='{id}_val2'/></span>",
    FILTER_DATE_FIELDS_TEMPLATE = "<span class='val1 hitlist-toggle-field' style='display:none'><input type='text' id='{id}_val1' value='{val1}' class='hitlist-filter-text-field' /><img src='/cf_clientutil/images/calendar_16.png' class='hitlist-filter-calicon'/></span><span class='val2 hitlist-toggle-field' style='display:none'> - <input type='text' id='{id}_val2' value='{val2}' class='hitlist-filter-text-field' /><img src='/cf_clientutil/images/calendar_16.png' class='hitlist-filter-calicon'/></span>",
    MODIFY_COLUMNS_BUTTON_TEMPLATE = "<span class='" + CLASS_MODIFY_COLUMNS_BUTTON + "' title='{caption}'><span>&nbsp;</span></span>"
    , _allColumnsChecked = function() {
      var self = this;
      return Y.Array.every(self._columnPanelContent.all("input[type=checkbox]").getDOMNodes(), function(checkbox) {
        return checkbox.checked;
      });
    }
    , _columnCancel = function(e) {
      var self = this;
      e.preventDefault();
      self._setCheckedColumns(self._checkedList);
      self._toggleColumnPanel();
    }
    , _columnApply = function(e) {
      var self = this, columnsToShow;
      e.preventDefault();
      self._checkedList = _getVisibleColumns.call(self);
      if (self._resetClicked === true) {
        self._setColumns(self._getDefaultColumns());
        columnsToShow = [];
      } else {
        self._setColumns(self._checkedList);
        columnsToShow = self._checkedList;
      }
      self._toggleColumnPanel();
      _clearPaging.call(self);
      self._applyColumnHeaderStyles();
      _getData.call(self, {
        initialLoad: true,
        columns: columnsToShow
      });
    }
    , _columnApplyExternal = function(extraColumns) {
      var self = this
        , columnsToShow = [];
      var allColumns = self.get("allColumns")
        , firstColumn = allColumns[0]["key"]
        , suffix = firstColumn.match("_\\d+$");
      columnsToShow.push(firstColumn);
      if (suffix) {
        var prefix = firstColumn.substr(0, firstColumn.indexOf(suffix) + 1);
        for (var j = 1; j < allColumns.length; j++) {
          if (allColumns[j]["key"].indexOf(prefix) == 0) {
            columnsToShow.push(allColumns[j]["key"]);
          }
        }
      }
      for (var i = 0; i < extraColumns.length; i++) {
        var exists = false;
        for (var k = 0; k < columnsToShow.length; k++) {
          if (extraColumns[i] == columnsToShow[k]) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          columnsToShow.push(extraColumns[i]);
        }
      }
      self._removeAllColumnsAndAddActiveColumns(columnsToShow);
      self._applyColumnHeaderStyles();
      _getData.call(self, {
        initialLoad: true,
        columns: columnsToShow
      });
    }
    , _columnResetDefault = function(e) {
      var self = this
        , defaultColumns = self._getDefaultColumns();
      e.preventDefault();
      self._setCheckedColumns(defaultColumns);
      self._resetClicked = true;
      _setCheckUncheckText.call(self);
    }
    , _checkUncheckAll = function(e) {
      var self = this
        , allColumnsChecked = _allColumnsChecked.call(self);
      e.preventDefault();
      allColumnsChecked = !allColumnsChecked;
      self._resetClicked = false;
      self._columnPanelContent.all("input[type=checkbox]").set("checked", allColumnsChecked);
      _setCheckUncheckText.call(self, allColumnsChecked);
    }
    , _setCheckUncheckText = function(allColumnsChecked) {
      var self = this;
      if (allColumnsChecked === undefined) {
        allColumnsChecked = _allColumnsChecked.call(self);
      }
      self._columnPanelContent.one(".hitlist-column-panel-checkall").set("text", allColumnsChecked ? self.get("captions.uncheckall") : self.get("captions.checkall"));
    }
    , _findSearchValue = function(id) {
      var self = this
        , searchValues = self.get("searchValues");
      return Y.Array.find(searchValues, function(searchValue) {
        return searchValue.id === id;
      });
    }
    , _removeBadge = function(e) {
      e.preventDefault();
      var self = this
        , badge = e.target.ancestor("div.hitlist-filter")
        , id = badge.getAttribute("data-fieldid");
      _clearSearchField.call(self, id);
      badge.addClass("hitlist-filter-fade-out");
      Y.later(500, self, self._renderSearchBadges);
      _clearPaging.call(self);
      _getData.call(self, {
        initialLoad: true,
        isSearching: true
      });
    }
    , _setPanelPosition = function(btn, panel) {
      var btnXY = btn.getXY();
      btnXY[1] += btn.get("offsetHeight");
      panel.setXY(btnXY);
    }
    , _createDropdownSearchControl = function(row, searchItem, searchValue) {
      searchItem.value = searchValue ? searchValue.val1[0] : "";
      searchItem.precode = searchValue ? searchValue.precode : "";
      var dropdown = Y.Node.create(Y.substitute("<input id='{id}_field' value='{value}' type='text' class='ac' onfocus=\"AutoComplete_Init(this, '{autoCompleteContext}', '', {autoCompleteValueInHidden}, null, false)\" /><img src='/cf_clientutil/ac.gif' class='aci' onclick=\"ac_ic(event, '{autoCompleteContext}', '', {autoCompleteValueInHidden}, null, false)\" />", searchItem));
      if (searchItem.autoCompleteValueInHidden) {
        var dropdownHiddenValue = Y.Node.create(Y.substitute("<input id='{id}_field_ac' value='{precode}' type='hidden' />", searchItem));
        dropdown.append(dropdownHiddenValue);
      }
      row.appendChild(dropdown);
    }
    , _createMultiElementSearchControl = function(row, searchItem, searchValue) {
      var self = this
        , dropdown = Y.Node.create(Y.substitute("<select id='{id}_field'><option></option><option value='1'>{yes}</option><option value='0'>{no}</option></select>", {
        id: searchItem.id,
        yes: self.get("captions.yes"),
        no: self.get("captions.no")
      }));
      if (searchValue) {
        dropdown.set("value", "" + searchValue.val1[0]);
      }
      row.appendChild(dropdown);
    }
    , _createOpenTextSearchControl = function(row, searchItem, searchValue) {
      var txt = Y.Node.create(Y.substitute("<input type='text' id='{id}_field' value='{value}' class='hitlist-opentext-field' />", {
        id: searchItem.id,
        value: searchValue ? searchValue.val1[0] : ""
      }));
      row.appendChild(txt);
    }
    , _createDateSearchControl = function(row, searchItem, searchValue) {
      var self = this
        , dropdownConfig = {
        id: searchItem.id,
        between: self.get("captions.between"),
        before: self.get("captions.before"),
        after: self.get("captions.after"),
        exactly: self.get("captions.exactly"),
        Between: SearchableListOperator.Between,
        LessThanOrEqual: SearchableListOperator.LessThanOrEqual,
        GreaterThanOrEqual: SearchableListOperator.GreaterThanOrEqual
      }
        , fieldsConfig = {
        id: searchItem.id,
        val1: searchValue.val1[0],
        val2: (searchValue.val2 && searchValue.val2.length === 1 ? searchValue.val2[0] : "")
      };
      _createDropdownFilter(row, searchValue, FILTER_DATE_TEMPLATE, dropdownConfig, FILTER_DATE_FIELDS_TEMPLATE, fieldsConfig);
    }
    , _createOpenNumericSearchControl = function(row, searchItem, searchValue) {
      var self = this
        , dropdownConfig = {
        id: searchItem.id,
        between: self.get("captions.between"),
        stoe: self.get("captions.stoe"),
        gtoe: self.get("captions.gtoe"),
        exactly: self.get("captions.exactly"),
        Between: SearchableListOperator.Between,
        LessThanOrEqual: SearchableListOperator.LessThanOrEqual,
        GreaterThanOrEqual: SearchableListOperator.GreaterThanOrEqual,
        Equal: SearchableListOperator.Equal
      }
        , fieldsConfig = {
        id: searchItem.id,
        val1: searchValue.val1[0],
        val2: (searchValue.val2 && searchValue.val2.length === 1 ? searchValue.val2[0] : "")
      };
      _createDropdownFilter(row, searchValue, FILTER_NUMERIC_TEMPLATE, dropdownConfig, FILTER_NUMERIC_FIELDS_TEMPLATE, fieldsConfig);
    }
    , _createDropdownFilter = function(row, searchValue, dropdownTemplate, dropdownConfig, fieldsTemplate, fieldsConfig) {
      var fields, dropdown = Y.Node.create(Y.substitute(dropdownTemplate, dropdownConfig)), fields = Y.Node.create(Y.substitute(fieldsTemplate, fieldsConfig));
      if (!Y.Lang.isUndefined(searchValue.op)) {
        dropdown.set("value", "" + searchValue.op);
      }
      dropdown.on("change", function() {
        _toggleIntervalSearchVisibility(dropdown, row.one(".val1"), row.one(".val2"));
      });
      row.appendChild(dropdown);
      row.appendChild(fields);
      _toggleIntervalSearchVisibility(dropdown, row.one(".val1"), row.one(".val2"));
    }
    , _toggleIntervalSearchVisibility = function(target, val1, val2) {
      switch (target.get("value")) {
        case "":
          val1.hide();
          val2.hide();
          return;
        case (SearchableListOperator.Between + ""):
          val1.show();
          val2.show();
          break;
        default:
          val1.show();
          val2.hide();
          break;
      }
      val1.one("input").focus();
    }
    , _getVisibleColumns = function() {
      var self = this;
      return self._columnPanelContent.all("input[type=checkbox]:checked").get("value");
    }
    , _getData = function(options, callback, failurecallback) {
      function containsSortCriteria(sortingValues) {
        if (sortingValues && sortingValues.sortBy && !Y.Object.isEmpty(sortingValues.sortBy)) {
          return true;
        }
        return false;
      }
      var self = this
        , uri = [self._basePath]
        , sortingPagingValues = self.get("sortingPagingValues");
      function disableClientSorting() {
        self._table.get("data").comparator = null ;
        self._table.get("data").sort = function() {}
        ;
      }
      var parseResponse = function(responseText) {
          var r = Y.JSON.parse(responseText);
          r.sortingPagingValues.pagingValues.firstStartValue = _fixJsonDate(r.sortingPagingValues.pagingValues.firstStartValue);
          r.sortingPagingValues.pagingValues.lastStartValue = _fixJsonDate(r.sortingPagingValues.pagingValues.lastStartValue);
          self.set("sortingPagingValues", r.sortingPagingValues);
          disableClientSorting();
          if (self._table.get("data").isEmpty()) {
            self._table.set("data", r.data);
          } else {
            self._table.get("data").reset(r.data);
          }
          self._table.set("pageInfo", r.pageInfo);
          var sortingValues = r.sortingPagingValues.sortingValues;
          if (containsSortCriteria(sortingValues)) {
            disableClientSorting();
            self._table.set("sortBy", sortingValues.sortBy);
          }
          self._prevButton.removeClass("disabled");
          self._nextButton.removeClass("disabled");
          if (r.sortingPagingValues.disablePrevButton) {
            self._prevButton.addClass("disabled");
          }
          if (r.sortingPagingValues.disableNextButton) {
            self._nextButton.addClass("disabled");
          }
          if (Y.Lang.isFunction(callback)) {
            callback();
          }
          self._container.one(".hitlist-pagination-count").insert(r.pageInfo + (r.sortingPagingValues.totalHits > 0 ? " (" + r.sortingPagingValues.totalHits + ")" : ""), "replace");
          self._applyColumnStyles();
          Y.Global.fire("hitlistloaded");
        }
        ;
      if (self._hitlistData != undefined) {
        parseResponse(self._hitlistData);
        return;
      }
      var cfg = {
        broadcast: 2,
        on: {
          success: function(id, response) {
            parseResponse(response.responseText);
          },
          failure: function(c, args) {
            if (args && args.statusText.indexOf("cluster assignments") > 0) {
              self._table.showMessage(args.statusText + ".");
            } else {
              if (Y.Object.isEmpty(self.get("columns"))) {
                self._table.showMessage(self.get("captions.errorNoColumns") + ".");
              } else {
                self._table.showMessage(self.get("captions.errorLoading") + ".");
              }
            }
            if (Y.Lang.isFunction(failurecallback)) {
              failurecallback();
            }
          },
          complete: function() {
            self._setUpdateDone();
          }
        }
      };
      self._setUpdateInProgress();
      var searchValues = self._createSearchValuesWithRemovedValueIfPrecodeExists();
      self._getSearchParameter(uri, searchValues);
      if (sortingPagingValues) {
        var pagingValuesString = Y.JSON.stringify(sortingPagingValues);
        if (sortingPagingValues.pagingValues && !isNaN(sortingPagingValues.pagingValues.pageNumber)) {
          var spv = Y.JSON.parse(pagingValuesString);
          if (options && options.initialLoad === true) {
            if (sortingPagingValues.pagingValues.pageNumber == 0) {
              spv.pagingValues = null ;
              pagingValuesString = Y.JSON.stringify(spv);
            }
          } else {
            spv.pagingValues.pageNumber += spv.pagingValues.pagingForward ? 1 : -1;
            pagingValuesString = Y.JSON.stringify(spv);
          }
        }
        uri.push("&sortingPagingValues=" + encodeURIComponent(pagingValuesString));
      }
      if (options && options.isSorting === true) {
        uri.push("&isSorting=1");
      }
      if (options && options.isPaging === true) {
        uri.push("&isPaging=1");
      }
      if (options && options.isSearching === true) {
        uri.push("&isSearching=1");
      }
      if (options && options.initialLoad === true) {
        uri.push("&initialLoad=1");
      }
      if (options && options.columns) {
        uri.push("&columns=" + options.columns);
      }
      if (Y.one("#PageStateId")) {
        uri.push("&pageStateId=" + Y.one("#PageStateId").get("value"));
      }
      if (self._reportStateAsQueryString) {
        uri.push("&" + self._reportStateAsQueryString);
      }
      _io = _io || new Y.IO({
          broadcast: 2
        });
      _io.send(uri.join(""), cfg);
    }
    , _fixJsonDate = function(jsonDate) {
      if (!(jsonDate && Y.Lang.isFunction(jsonDate.replace))) {
        return jsonDate;
      }
      var constructor = jsonDate.replace(new RegExp("^/Date\\(([-+]?\\d+)\\)/$"), "new Date($1)");
      if (constructor == jsonDate) {
        return jsonDate;
      }
      return eval(constructor);
    }
    , _clearSearchField = function(id) {
      var self = this;
      _removeFromSearch.call(self, _findSearchValue.call(self, id));
    }
    , _clearSearchFields = function() {
      var self = this
        , container = self._container.one(SELECTOR_FILTER_PANEL);
      if (!container) {
        return;
      }
      container.all("input, select").set("value", "");
      container.all(".hitlist-toggle-field").hide();
    }
    , _setSearchValues = function(callback) {
      var self = this
        , searchItems = self.get("searchItems")
        , searchValues = self.get("searchValues")
        , itemsToRemove = []
        , valid = false
        , container = self._container.one(SELECTOR_FILTER_PANEL);
      if (container) {
        valid = Y.Array.every(searchItems, function(searchItem) {
          var row = container.one("#item_" + searchItem.id)
            , firstInput = row.one("input,select")
            , hiddenInput = row.one("input[type='hidden']")
            , value = firstInput.get("value")
            , hiddenValue = hiddenInput ? hiddenInput.get("value") : null
            , searchValue = _findSearchValue.call(self, searchItem.id);
          if (value) {
            if (!searchValue) {
              searchValue = {
                type: searchItem.type,
                label: searchItem.label,
                id: searchItem.id
              };
              searchValues.push(searchValue);
            }
            switch (searchItem.type) {
              case HitListElementType.Date:
              case HitListElementType.OpenNumeric:
                searchValue.op = parseInt(row.one("select").get("value"), 10);
                searchValue.val1 = [row.one(".val1 input").get("value")];
                searchValue.val2 = (searchValue.op === SearchableListOperator.Between) ? [row.one(".val2 input").get("value")] : [];
                if (searchValue.op === SearchableListOperator.Between && (searchValue.val1[0] === "" || searchValue.val2[0] === "")) {
                  return false;
                }
                break;
              default:
                searchValue.op = (searchItem.type === HitListElementType.OpenText) ? SearchableListOperator.LIKE : SearchableListOperator.Equal;
                searchValue.val1 = [value];
                searchValue.val2 = null ;
                if (hiddenValue) {
                  searchValue.precode = hiddenValue;
                }
                break;
            }
          } else {
            if (searchValue) {
              itemsToRemove.push(searchValue);
            }
          }
          return true;
        });
      }
      if (valid) {
        self.set("searchValues", searchValues);
        _removeFromSearch.call(self, itemsToRemove, callback);
      }
      return valid;
    }
    , _removeFromSearch = function(itemsToRemove, callback) {
      var self = this
        , searchValues = self.get("searchValues");
      itemsToRemove = Y.Array(itemsToRemove);
      var list = new Y.ArrayList(searchValues);
      Y.each(itemsToRemove, function(searchValue) {
        list.remove(searchValue);
      });
      self.set("searchValues", list._items);
      if (Y.Lang.isFunction(callback)) {
        callback();
      }
    }
    , _clearPaging = function() {
      this.get("sortingPagingValues").pagingValues = null ;
    }
    , _toggleSearchPanelVisibility = function(forceHide) {
      var self = this
        , btn = self._container.one(".hitlist-dropdown-button")
        , panel = self._container.one(".hitlist-dropdown-panel");
      panel.detach("clickoutside");
      if (forceHide === true) {
        self._container.one(".hitlist-dropdown-panel").addClass(CLASS_FILTER_PANEL_HIDDEN);
        btn.removeClass("hitlist-dropdown-panel-open");
      } else {
        Y.use("cssbutton", "node-screen", function() {
          if (!self._resizeFiltersHandle) {
            Y.use("event-resize", "yui-later", function() {
              self._resizeFiltersHandle = Y.on("windowresize", Y.bind(_setPanelPosition, self, btn, panel));
            });
          }
          panel.toggleClass(CLASS_FILTER_PANEL_HIDDEN);
          btn.toggleClass("hitlist-dropdown-panel-open");
          _setPanelPosition(btn, panel);
          Y.use("event-outside", function() {
            panel.on("clickoutside", function(e) {
              if (e.target.ancestor("div.yui-ac") || e.target.ancestor("div.yui-calcontainer")) {
                return;
              }
              _toggleSearchPanelVisibility.call(self, true);
            });
          });
        });
      }
    }
    , _renderSearchPanel = function() {
      var self = this
        , searchItems = self.get("searchItems")
        , fieldContainer = self._container.one(SELECTOR_FILTER_PANEL);
      fieldContainer.empty();
      Y.each(searchItems, function(searchItem) {
        var row = fieldContainer.appendChild(Y.Node.create(Y.substitute(FILTER_ROW_TEMPLATE, {
          id: "item_" + searchItem.id
        })))
          , searchValue = _findSearchValue.call(self, searchItem.id) || {
            precode: "",
            val1: [""],
            val2: []
          };
        row.appendChild(Y.Node.create(Y.substitute(FILTER_LABEL_TEMPLATE, {
          id: searchItem.id,
          label: searchItem.label
        })));
        switch (searchItem.type) {
          case HitListElementType.Single:
          case HitListElementType.Multi:
          case HitListElementType.GridElement:
          case HitListElementType.AdditionalColumn:
            _createDropdownSearchControl.call(self, row, searchItem, searchValue);
            break;
          case HitListElementType.Date:
            _createDateSearchControl.call(self, row, searchItem, searchValue);
            break;
          case HitListElementType.OpenNumeric:
            _createOpenNumericSearchControl.call(self, row, searchItem, searchValue);
            break;
          case HitListElementType.MultiElement:
            _createMultiElementSearchControl.call(self, row, searchItem, searchValue);
            break;
          default:
            _createOpenTextSearchControl.call(self, row, searchItem, searchValue);
            break;
        }
      });
    }
    , _toggleFilters = function(e, container) {
      var self = this;
      e.halt();
      _renderSearchPanel.call(self);
      _toggleSearchPanelVisibility.call(self);
    }
    , _showCalendar = function(e) {
      var icon = e.target
        , input = icon.previous("input");
      if (!icon.get("id")) {
        icon.set("id", cb.newID());
      }
      DatePicker_Init(e._event, input.get("id"), false, function(dp) {
        dp.textboxId = input.get("id");
        dp.imageId = icon.get("id");
        dp.show();
      });
    }
    , _dataLoad = function(reportState) {
      var self = this;
      if (reportState) {
        self._reportStateAsQueryString = reportState;
      }
      if (self._reportStateAsQueryString) {
        _getData.call(self, {
          initialLoad: true
        });
        self._renderSearchBadges();
      }
    }
    , _dataUpdated = function(reportStateAsQueryString) {
      var self = this;
      self._reportStateAsQueryString = reportStateAsQueryString;
      if (self.get("noInitialLoad")) {
        Y.Global.fire("hitlistready", self.get("clientId"), reportStateAsQueryString);
        return;
      }
      _getData.call(self, {
        initialLoad: true
      });
      self._renderSearchBadges();
    }
    , _exportHitlist = function() {
      var self = this;
      viewmode.exportComponent(self.get("componentId"), self.get("pageId"), "ReportalHitList");
    }
    , _skipPageAndUpdateSingleView = function(singleViewPlugin, offset) {
      var _this = this
        , table = _this._table
        , direction = offset == 1
        , firstOrLastChild = direction ? "first" : "last"
        , singleViewHost = singleViewPlugin._singleViewOverlay.bodyNode;
      singleViewHost.all(".sv-header, .sv-questions-container").setStyles({
        opacity: 0
      });
      _this._skipPage(direction, function() {
        var keys = _keyManager.getKeys(table, _keyManager.keyNameEnhancer)
          , tableSize = table.get("data").size()
          , newKey = direction ? keys[0] : keys[tableSize - 1];
        singleViewPlugin.set("RespondentIndex", singleViewPlugin.get("RespondentIndex") + offset);
        singleViewPlugin.set("Key", newKey.getAttrs());
        singleViewPlugin.set("PageNumber", _this.get("sortingPagingValues").pagingValues.pageNumber);
        _this.get("host").one(".yui3-datatable-data > tr:" + firstOrLastChild + "-child").addClass("hitlist-selected-row");
      });
    }
    , _replaceRespondent = function(singleViewPlugin, offset) {
      var _this = this
        , table = _this._table
        , tableSize = table.get("data").size()
        , displayedKey = _keyManager.getKey(singleViewPlugin.get("Key"))
        , keys = _keyManager.getKeys(table, _keyManager.keyNameEnhancer)
        , respondentIndexInPage = _getIndexInCurrentPage(keys, displayedKey)
        , displayedPageNumber = singleViewPlugin.get("PageNumber")
        , respondentIndex = singleViewPlugin.get("RespondentIndex")
        , newRespondentIndex = respondentIndex + offset
        , totalHits = singleViewPlugin.get("TotalHits")
        , selectedRowNode = _this.get("host").one(".hitlist-selected-row")
        , singleViewHost = singleViewPlugin._singleViewOverlay.bodyNode;
      if (respondentIndexInPage + offset === tableSize && totalHits !== respondentIndex) {
        _skipPageAndUpdateSingleView.call(_this, singleViewPlugin, offset);
      } else {
        if (respondentIndexInPage + offset === -1 && displayedPageNumber > 0) {
          _skipPageAndUpdateSingleView.call(_this, singleViewPlugin, offset);
        } else {
          if (newRespondentIndex > 0 && newRespondentIndex <= totalHits) {
            var newKey = Y.Array.find(keys, function(key) {
              return key.get("value") === (respondentIndexInPage + offset);
            });
            singleViewHost.all(".sv-header, .sv-questions-container").setStyles({
              opacity: 0
            });
            singleViewPlugin.set("RespondentIndex", newRespondentIndex);
            singleViewPlugin.set("Key", newKey.getAttrs());
            selectedRowNode.removeClass("hitlist-selected-row");
            if (offset == 1) {
              selectedRowNode.next().addClass("hitlist-selected-row");
            } else {
              selectedRowNode.previous().addClass("hitlist-selected-row");
            }
          }
        }
      }
    }
    , _selectRow = function(e) {
      var self = this
        , selectedRow = e.currentTarget;
      if (e.target.test("a") || (e.target.test("img") && e.target.ancestor().test("a")) || self._table.get("data").isEmpty()) {
        return;
      }
      self.get("host").all("tr." + CLASS_SELECTED_ROW).removeClass(CLASS_SELECTED_ROW);
      selectedRow.addClass(CLASS_SELECTED_ROW);
      Y.use("reportal-singleview", function() {
        var rowModel = self._table.getRecord(selectedRow.get("id"))
          , container = Y.Node.create("<div />").appendTo("body")
          , pageNumber = self.get("sortingPagingValues").pagingValues.pageNumber
          , indexOfFirstItemInPage = self._table.get("pageInfo").split("-")[0]
          , key = _keyManager.getKey(rowModel, _keyManager.keyNameEnhancer)
          , keys = _keyManager.getKeys(self._table, _keyManager.keyNameEnhancer)
          , plugin = container.plug(Y.SingleView, {
          ServiceUrl: self.get("singleViewApiUrl"),
          FormsChunkServiceUrl: self.get("singleViewFormsChunkApiUrl"),
          Texts: self.get("singleViewTexts"),
          Key: key.getAttrs(),
          Language: self.get("language"),
          TotalHits: self.get("sortingPagingValues").totalHits,
          RespondentIndex: parseInt(indexOfFirstItemInPage, 10) + _getIndexInCurrentPage(keys, key),
          PageNumber: pageNumber,
          PanelIsOpened: false,
          Version: self.get("version")
        })["single-view"];
        plugin.on("close", function() {
          container.remove(true);
          self.get("host").one(".hitlist-selected-row").removeClass("hitlist-selected-row");
        });
        plugin.on("back", function() {
          _replaceRespondent.call(self, plugin, -1);
        });
        plugin.on("next", function() {
          _replaceRespondent.call(self, plugin, +1);
        });
      });
    }
    , _getIndexInCurrentPage = function(keys, targetKey) {
      var key = Y.Array.find(keys, function(sourceKey) {
        return _keyManager.keyComparer(sourceKey, targetKey);
      });
      return key.get("value");
    }
    , _keyManager = {
      tableKeyNames: ["responseid", "combined_sourceid"],
      keyNameEnhancer: function(keyName) {
        return keyName + " Code";
      },
      keyComparer: function(sourceKey, targetKey) {
        var res = true;
        Y.each(this.tableKeyNames, function(keyName) {
          res = res && (sourceKey.get(keyName) == targetKey.get(keyName));
        });
        return res;
      },
      getKey: function(cfg, sourceKeyNameEnhancer) {
        var _this = this;
        if (!Y.Lang.isFunction(sourceKeyNameEnhancer)) {
          sourceKeyNameEnhancer = function(name) {
            return name;
          }
          ;
        }
        var getVal = function(name) {
            var keyName = sourceKeyNameEnhancer(name);
            try {
              return this[keyName] || this.get(keyName) || this[name] || this.get(name);
            } catch (e) {
              return null ;
            }
          }
          ;
        var keyClass = function(_cfg) {
            var attrs = {};
            Y.each(_this.tableKeyNames, function(keyName) {
              attrs[keyName] = {
                value: null
              };
              if (_cfg) {
                attrs[keyName].value = getVal.call(_cfg, keyName);
              }
            });
            attrs.value = {
              value: null
            };
            this.addAttrs(attrs, _cfg);
          }
          ;
        Y.augment(keyClass, Y.Attribute);
        return new keyClass(cfg);
      },
      getKeys: function(table, sourceKeyNameEnhancer) {
        var data = table.get("data")
          , tableSize = data.size()
          , keys = [];
        if (!Y.Lang.isFunction(sourceKeyNameEnhancer)) {
          sourceKeyNameEnhancer = function(name) {
            return name;
          }
          ;
        }
        for (var i = 0; i < tableSize; i++) {
          var key = this.getKey(table.getRecord(i), sourceKeyNameEnhancer);
          key.set("value", i);
          keys.push(key);
        }
        return keys;
      },
    }, HitListPlugin = function(config) {
      HitListPlugin.superclass.constructor.apply(this, arguments);
    }
    ;
  HitListPlugin.NAME = HitListPlugin.NS = "HitListPlugin";
  HitListPlugin.ATTRS = {
    version: {
      writeOnce: CONST_INIT_ONLY
    },
    singleViewApiUrl: {
      writeOnce: CONST_INIT_ONLY
    },
    singleViewFormsChunkApiUrl: {
      writeOnce: CONST_INIT_ONLY
    },
    singleViewTexts: {
      writeOnce: CONST_INIT_ONLY
    },
    clientId: {
      writeOnce: CONST_INIT_ONLY
    },
    columns: {
      value: [],
      writeOnce: CONST_INIT_ONLY
    },
    serviceUrl: {
      writeOnce: CONST_INIT_ONLY
    },
    hitlistData: {
      writeOnce: CONST_INIT_ONLY
    },
    componentId: {
      writeOnce: CONST_INIT_ONLY
    },
    pageId: {
      writeOnce: CONST_INIT_ONLY
    },
    prevText: {
      writeOnce: CONST_INIT_ONLY
    },
    nextText: {
      writeOnce: CONST_INIT_ONLY
    },
    sortingPagingValues: {},
    searchItems: {
      writeOnce: CONST_INIT_ONLY
    },
    searchValues: {
      getter: function(value) {
        return value || [];
      }
    },
    allColumns: {
      value: [],
      writeOnce: CONST_INIT_ONLY
    },
    preview: {
      writeOnce: CONST_INIT_ONLY
    },
    pageAjaxEnabled: {
      writeOnce: CONST_INIT_ONLY
    },
    language: {
      writeOnce: CONST_INIT_ONLY
    },
    captions: {
      writeOnce: CONST_INIT_ONLY
    },
    styles: {
      writeOnce: CONST_INIT_ONLY
    },
    hashedProjectId: {
      writeOnce: CONST_INIT_ONLY
    },
    showSingleViewOnRowSelect: {
      writeOnce: CONST_INIT_ONLY
    },
    noInitialLoad: {
      writeOnce: CONST_INIT_ONLY
    }
  };
  Y.extend(HitListPlugin, Y.Plugin.Base, {
    initializer: function() {
      var self = this,
        host = self.get("host"),
        container = host.ancestor(".hitlist-container"),
        styles = self.get("styles"),
        getClassFunc;
      self._container = container;
      self._columnPanelVisible = false;
      self._checkedList = [];
      self._resetClicked = false;
      self._basePath = self.get("serviceUrl") + "&PageId=" + self.get("pageId") + "&Preview=" + self.get("preview");
      self._hitlistData = self.get("hitlistData");
      var columns = self.get("columns");
      columns.unshift({
        key: CONST_MODIFY_COLUMN_ID,
        label: Y.substitute(MODIFY_COLUMNS_BUTTON_TEMPLATE, {
          caption: self.get("captions.showhide")
        }),
        allowHTML: true,
        emptyCellValue: "&nbsp;",
        width: "40px",
        className: "utilityCol"
      });
      self._table = new Y.DataTable({
        columns: self.get("columns"),
        scrollable: "y"
      });
      getClassFunc = self._table.getClassName;
      self._table.getClassName = function() {
        var ret = ""
          , firstClassName = arguments[0];
        if (firstClassName in {
            table: 1,
            header: 1,
            cell: 1
          }) {
          ret = styles[firstClassName];
        }
        return Y.Lang.trim(getClassFunc.apply(self._table, arguments) + " " + (ret || ""));
      }
      ;
      self._table.on("sort", function(e) {
        if (self._isUpdateInProgress()) {
          return;
        }
        e.preventDefault();
        var spv = self.get("sortingPagingValues") || {};
        if (e.sortBy.length > 0) {
          spv.sortingValues.sortBy = e.sortBy[0];
          _clearPaging.call(self);
          _getData.call(self, {
            isSorting: true,
            initialLoad: true
          });
        }
      });
      self._table.render(host).showMessage(self.get("captions.loadingData"));
      self._setPrevNextTextsAndActions();
      if (!self.get("pageAjaxEnabled")) {
        _getData.call(self, {
          initialLoad: true
        });
        self._renderSearchBadges();
      }
      self._table.delegate("click", function(e) {
        var selectedRow = e.currentTarget;
        if (typeof HAS_SINGLEVIEW === "boolean" && HAS_SINGLEVIEW) {
          if (Y.Lang.isFunction(ssv)) {
            var rowModel = self._table.getRecord(selectedRow.get("id"));
            ssv(rowModel.get("responseid"), self.get("hashedProjectId"), self.get("componentId"), self.get("preview"), !self.get("preview"));
          }
        } else {
          if (self.get("showSingleViewOnRowSelect")) {
            _selectRow.call(self, e);
          }
        }
      }, "tbody tr", self);
      self._applyColumnHeaderStyles();
      Y.Global.on("hitlistload:" + self.get("clientId"), _dataLoad, self);
      Y.Global.on("columns:apply", function(list) {
        _columnApplyExternal.call(self, list);
      });
      Y.Global.on("reportcontroller:viewModeDataUpdate", _dataUpdated, self);
      container.delegate("click", _exportHitlist, ".hitlist-export-button", self);
      container.delegate("click", _showCalendar, ".hitlist-filter-calicon", self);
      container.delegate("click", _toggleFilters, ".hitlist-dropdown-button", self);
      container.delegate("click", _removeBadge, ".hitlist-filter-remove", self);
      container.delegate("click", _columnResetDefault, ".hitlist-column-panel-reset", self);
      container.delegate("click", _checkUncheckAll, ".hitlist-column-panel-checkall", self);
      container.delegate("click", _columnCancel, ".hitlist-column-panel-cancel", self);
      container.delegate("click", _columnApply, ".hitlist-column-panel-apply", self);
      container.delegate("click", function(e) {
        e.preventDefault();
        _clearSearchFields.call(self);
      }, ".hitlist-dropdown-clear");
      container.delegate("click", function(e) {
        e.preventDefault();
        _toggleSearchPanelVisibility.call(self, true);
      }, ".hitlist-dropdown-cancel");
      container.delegate("click", function(e) {
        var cleanUpSearch = function() {
            _toggleSearchPanelVisibility.call(self, true);
            self._renderSearchBadges();
          }
          ;
        e.preventDefault();
        _setSearchValues.call(self, function() {
          _clearPaging.call(self);
          _getData.call(self, {
            initialLoad: true,
            isSearching: true
          }, cleanUpSearch, cleanUpSearch);
        });
      }, ".hitlist-dropdown-filter-apply");
      container.delegate("click", function(e) {
        e.stopPropagation();
        self._toggleColumnPanel();
      }, SELECTOR_MODIFY_COLUMNS_BUTTON);
    },
    _renderSearchBadges: function() {
      var self = this
        , searchValues = self.get("searchValues")
        , wrapper = self._container.one(".hitlist-filter-wrapper");
      wrapper.all(".hitlist-filter").remove();
      Y.each(searchValues, function(searchValue) {
        var text, badge;
        switch (searchValue.op) {
          case SearchableListOperator.Equal:
          case SearchableListOperator.IN:
            text = searchValue.val1;
            break;
          case SearchableListOperator.GreaterThanOrEqual:
            text = " &gt;= " + searchValue.val1;
            break;
          case SearchableListOperator.LessThanOrEqual:
            text = " &lt;= " + searchValue.val1;
            break;
          case SearchableListOperator.LIKE:
            if (searchValue.type === HitListElementType.MultiElement) {
              text = searchValue.val1[0] === "0" ? self.get("captions.no") : self.get("captions.yes");
            } else {
              text = " starts with " + searchValue.val1;
            }
            break;
          case SearchableListOperator.Between:
            text = " " + self.get("captions.between") + " " + searchValue.val1 + " and " + searchValue.val2;
            break;
        }
        badge = Y.Node.create(Y.substitute(BADGE_TEMPLATE, {
          id: searchValue.id,
          label: searchValue.label,
          value: text
        }));
        wrapper.appendChild(badge);
      });
    },
    _setPrevNextTextsAndActions: function() {
      var self = this
        , prevText = self.get("prevText")
        , nextText = self.get("nextText");
      self._prevButton = self._container.one("a.hitlist-nav-prev"),
        self._nextButton = self._container.one("a.hitlist-nav-next");
      if (prevText) {
        self._prevButton.set("text", prevText);
      }
      if (nextText) {
        self._nextButton.set("text", nextText);
      }
      self._container.all("a.hitlist-nav-button").on("click", function(e) {
        if (self._isUpdateInProgress()) {
          return;
        }
        var pagingForward = e.currentTarget.hasClass("hitlist-nav-next");
        if (!e.currentTarget.hasClass("disabled")) {
          self._skipPage(pagingForward);
        }
        e.halt();
      });
    },
    _skipPage: function(pagingForward, callback) {
      var self = this
        , spv = self.get("sortingPagingValues").pagingValues;
      spv.pagingForward = pagingForward;
      spv.startId = pagingForward ? spv.lastStartId : spv.firstStartId;
      spv.startValue = pagingForward ? spv.lastStartValue : spv.firstStartValue;
      _getData.call(self, {
        isPaging: true
      }, callback);
    },
    _getSearchParameter: function(uri, values) {
      if (values.length > 0) {
        uri.push("&search=" + encodeURIComponent(Y.JSON.stringify(values)));
      }
    },
    _createSearchValuesWithRemovedValueIfPrecodeExists: function() {
      var searchValues = this.get("searchValues");
      var newSearchValues = [];
      for (var i = 0; i < searchValues.length; i++) {
        if (searchValues[i].precode) {
          newSearchValues.push({
            id: searchValues[i].id,
            op: searchValues[i].op,
            precode: searchValues[i].precode,
            type: searchValues[i].type
          });
        } else {
          newSearchValues.push(searchValues[i]);
        }
      }
      return newSearchValues;
    },
    _renderColumnPanel: function() {
      var self = this, host = self.get("host"), columnBtn = host.one(SELECTOR_MODIFY_COLUMNS_BUTTON), panel;
      self._columnPanel = new Y.Panel({
        bodyContent: self._renderColumns(),
        x: columnBtn.getX(),
        y: columnBtn.getY() + columnBtn.get("offsetHeight"),
        buttons: [],
        render: host,
        visible: false
      });
      self._columnPanelContent = panel = self._columnPanel.get("boundingBox");
      panel.addClass("hitlist-column-panel");
      panel.append('<span class="hitlist-column-panel-nav"></span>');
      self._renderColumnPanelButtons();
    },
    _renderColumns: function() {
      var self = this
        , allColumns = self.get("allColumns")
        , componentId = self.get("componentId")
        , content = Y.substitute('<a href="#" class="hitlist-column-panel-reset">{reset}</a><a href="#" class="hitlist-column-panel-checkall"></a><div class="hitlist-columns reportal-clearfix">', {
        reset: self.get("captions.showdefaultcols")
      })
        , tempContent = ""
        , rowCount = 1
        , visibleColumns = {};
      Y.each(self._table.get("columns"), function(column) {
        if (column.key !== CONST_MODIFY_COLUMN_ID) {
          visibleColumns[column.key] = 1;
        }
      });
      Y.each(allColumns, function(column) {
        if (rowCount === 1) {
          tempContent = '<div class="hitlist-column">';
        }
        tempContent += '<div class="hitlist-column-row"><input' + (visibleColumns[column.key] ? ' checked="checked"' : "") + ' type="checkbox" value="' + column.key + '" id="col-' + componentId + "-" + column.key + '"/><label for="col-' + componentId + "-" + column.key + '">' + column.label + "</label></div>";
        if (rowCount == 10) {
          content += tempContent + "</div>";
          tempContent = "";
          rowCount = 1;
        } else {
          rowCount++;
        }
      }, self);
      if (tempContent) {
        content += tempContent + "</div>";
      }
      content += "</div>";
      return content;
    },
    _renderColumnPanelButtons: function() {
      var self = this;
      self._columnPanelContent.one(".hitlist-column-panel-nav").append(Y.substitute('<button class="hitlist-column-panel-cancel">{caption}</button>', {
        caption: self.get("captions.cancel")
      })).append(Y.substitute('<button class="yui3-button-primary yui3-button hitlist-column-panel-apply">{caption}</button>', {
        caption: self.get("captions.apply")
      }));
    },
    _getDefaultColumns: function() {
      var defaultColumns = [];
      Y.each(this.get("allColumns"), function(column) {
        if (!column.hiddenByDefault) {
          defaultColumns.push(column.key);
        }
      });
      return defaultColumns;
    },
    _setColumns: function(checkedList) {
      var self = this;
      self._removeAllColumnsAndAddActiveColumns(checkedList);
      self._setCheckedColumns(checkedList);
    },
    _removeAllColumnsAndAddActiveColumns: function(activeColumns) {
      var self = this
        , allColumns = self.get("allColumns");
      var sortBy = self._table.get("sortBy");
      Y.each(allColumns, function(column) {
        self._table.removeColumn(column.key);
      });
      Y.each(activeColumns, function(column) {
        var col = Y.Array.find(allColumns, function(c) {
          return c.key === column;
        });
        self._table.addColumn({
          key: column,
          label: col.label,
          allowHTML: col.allowHTML,
          sortable: col.sortable
        });
      });
      self._table.set("sortBy", sortBy);
    },
    _setCheckedColumns: function(columns) {
      var self = this;
      Y.all(".hitlist-column-panel input[type=checkbox]").set("checked", false);
      Y.each(columns, function(columnName) {
        var columnToFind = "#col-" + self.get("componentId") + "-" + columnName;
        Y.one(columnToFind).set("checked", "checked");
      });
    },
    _toggleColumnPanel: function() {
      var self = this
        , host = self.get("host");
      if (!self._columnPanel) {
        Y.use("panel", "cssbutton", function() {
          self._renderColumnPanel();
          self._showColumnPanel();
          Y.use("event-resize", "yui-later", function() {
            var panel = host.one(".hitlist-column-panel")
              , btn = host.one("." + CLASS_MODIFY_COLUMNS_BUTTON);
            Y.on("windowresize", function() {
              if (self._columnPanelVisible) {
                _setPanelPosition(btn, panel);
              }
            });
          });
        });
      } else {
        if (self._columnPanelVisible) {
          self._hideColumnPanel();
        } else {
          self._columnPanel.set("bodyContent", self._renderColumns());
          self._showColumnPanel();
          _setPanelPosition(host.one("." + CLASS_MODIFY_COLUMNS_BUTTON), host.one(".hitlist-column-panel"));
        }
      }
    },
    _showColumnPanel: function() {
      var self = this
        , host = self.get("host");
      self._checkedList = _getVisibleColumns.call(self);
      self._columnPanelVisible = true;
      self._columnPanel.show();
      self._resetClicked = false;
      _setCheckUncheckText.call(self);
      if (self._columnCheckedHandle) {
        self._columnCheckedHandle.detach();
      }
      self._columnCheckedHandle = self._columnPanelContent.all("input[type=checkbox]").on("change", function() {
        self._resetClicked = false;
        _setCheckUncheckText.call(self);
      });
      host.one(".hitlist-column-panel").once("clickoutside", function(e) {
        self._hideColumnPanel();
      });
    },
    _hideColumnPanel: function() {
      var self = this;
      self._columnPanelVisible = false;
      self._columnPanel.hide();
    },
    _applyColumnHeaderStyles: function() {
      var self = this;
      Y.each(self.get("columns"), function(c) {
        if (c.headerStyle) {
          self.get("host").all("th." + CONST_COLUM_CLASS_PREFIX + c.key).addClass(c.headerStyle);
        }
      });
    },
    _applyColumnStyles: function() {
      var self = this
        , even = true
        , bSetCellStyles = Y.some(self.get("columns"), function(c) {
        return !!(c.contentStyle || c.alternatingStyle);
      });
      if (!bSetCellStyles) {
        return;
      }
      Y.each(self.get("host").all("tr"), function(tr) {
        Y.each(self.get("columns"), function(c) {
          if (c.contentStyle) {
            tr.all("td." + CONST_COLUM_CLASS_PREFIX + c.key).addClass(c.contentStyle);
          }
          if (c.alternatingStyle && !even) {
            tr.all("td." + CONST_COLUM_CLASS_PREFIX + c.key).addClass(c.alternatingStyle);
          }
        });
        even = !even;
      });
    },
    _setUpdateInProgress: function() {
      this._container.addClass(CONST_LOADING_CLASS);
    },
    _setUpdateDone: function() {
      this._container.removeClass(CONST_LOADING_CLASS);
    },
    _isUpdateInProgress: function() {
      this._container.removeClass(CONST_LOADING_CLASS);
    }
  });
  Y.namespace("Reportal").HitList = HitListPlugin;
}, "1", {
  requires: ["reportalcss-hitlist", "selector-css3", "substitute", "node-base", "io-base", "datatable", "plugin", "json", "node-pluginhost", "yui-later", "intl", "event-custom", "arraylist-add"]
});
