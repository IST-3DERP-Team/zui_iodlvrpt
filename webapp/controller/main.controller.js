sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../js/Common",
    "../js/Utils",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/HashChanger",
    'sap/m/Token',
    'sap/m/ColumnListItem',
    'sap/m/Label',
    "../js/TableValueHelp",
    "../js/TableFilter",
    'jquery.sap.global',
    "../js/SmartFilterCustomControl",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Common, Utils, Filter, FilterOperator, HashChanger, Token, ColumnListItem, Label, TableValueHelp, TableFilter, jQuery, SmartFilterCustomControl) {
        "use strict";

        var me;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
        var sapDateFormat2 = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyyMMdd" });
        var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "KK:mm:ss a" });

        return Controller.extend("zuiiodlvrpt.controller.main", {
            onInit: async function () {
                me = this;
                this._aIOColumns = {};
                this._aColumns = {};
                this._aDataBeforeChange = [];
                this._validationErrors = [];
                this._bHdrChanged = false;
                this._bDtlChanged = false;
                this._dataMode = "READ";
                this._aColFilters = [];
                this._aColSorters = [];
                this._aMultiFiltersBeforeChange = [];
                this._aFilterableColumns = {};
                this._sActiveTable = "headerTab";
                this._oModel = this.getOwnerComponent().getModel();
                this._tableValueHelp = TableValueHelp;
                this._tableFilter = TableFilter;
                this._smartFilterCustomControl = SmartFilterCustomControl;
                this._colFilters = {};   
                
                this._ccolumns;
                this._pvtColumnData;
                this._pvtPivotArray;

                this._oTables = [
                    { TableId: "headerTab" }
                    // ,{ TableId: "detailTab" }
                ];

                this._oTableLayout = {
                    headerTab: {
                        type: "RPTHDR",
                        tabname: "ZBV_3D_IODLVRPT"
                    }
                    // ,detailTab: {
                    //     type: "ASNDET",
                    //     tabname: "ZERP_SCIASNDET"
                    // }
                }

                SmartFilterCustomControl.setSmartFilterModel(this);

                this.getView().setModel(new JSONModel({
                    activeIONO: "",
                    activeIONODisplay: "",
                    activeDLVSEQ: "",
                    activeDLVSEQDisplay: "",
                    activeCUSTCOLOR: "",
                    activeCUSTCOLORDisplay: "",
                    fullscreen: {
                        header: false
                        // ,detail: false
                    },
                    dataWrap: {
                        headerTab: false
                        // ,detailTab: false
                    },
                    DisplayMode: "change",
                    sbu: ""
                }), "ui");

                this._counts = {
                    header: 0
                    // ,detail: 0
                }

                this.getView().setModel(new JSONModel(this._counts), "counts");

                this.byId("headerTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                // this.byId("detailTab")
                //     .setModel(new JSONModel({
                //         columns: [],
                //         rows: []
                //     }));

                var oDDTextParam = [], oDDTextResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                //TABLE COLUMNS
                oDDTextParam.push({ CODE: "SBU" });
                oDDTextParam.push({ CODE: "IONO" });
                oDDTextParam.push({ CODE: "PRODPLANT" });
                oDDTextParam.push({ CODE: "IONOPREFIX" });
                oDDTextParam.push({ CODE: "PLANTNAME" });
                oDDTextParam.push({ CODE: "TCSMV" });
                oDDTextParam.push({ CODE: "CUSTNAME" });
                oDDTextParam.push({ CODE: "SHIPQTY" });
                oDDTextParam.push({ CODE: "SZESHIPQTY" });
                //LABELS

                //INFO


                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oDDTextParam }, {
                    method: "POST",
                    success: function (oData, oResponse) {
                        oData.CaptionMsgItems.results.forEach(item => {
                            oDDTextResult[item.CODE] = item.TEXT;
                        })

                        me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");
                    },
                    error: function (err) { }
                });

                
                var SIZESEQModel = new sap.ui.model.json.JSONModel();
                
                await new Promise((resolve, reject) => {
                    this._oModel.read("/SIZELISTSet", {
                        success: function (oData, oResponse) {
                            // console.log("IOATTRIBTYPSet");

                            oData.results.sort((a, b,) => (a.ATTRIBSEQ > b.ATTRIBSEQ ? 1 : -1));
                            // console.log("SIZELISTSet", oData);
                            SIZESEQModel.setData(oData.results);
                            me.getView().setModel(new JSONModel(SIZESEQModel), "SIZESEQModel");
                            resolve();
                        },
                        error: function (err) {
                            resolve();
                        }

                    });
                });

                var oTableEventDelegate = {
                    onkeyup: function (oEvent) {
                        me.onKeyUp(oEvent);
                    },

                    onAfterRendering: function (oEvent) {
                        var oControl = oEvent.srcControl;
                        var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

                        if (sTabId.substr(sTabId.length - 3) === "Tab") me._tableRendered = sTabId;
                        else me._tableRendered = "";

                        me.onAfterTableRendering();
                    },

                    onclick: function (oEvent) {
                        me.onTableClick(oEvent);
                    }
                };

                this.byId("headerTab").addEventDelegate(oTableEventDelegate);
                // this.byId("detailTab").addEventDelegate(oTableEventDelegate);
                this.getRptColumnProp();

                // this.getHeaderData();

                this.getAppAction();
            },

            getAppAction: async function () {
                var csAction = "change";
                if (sap.ushell.Container !== undefined) {
                    const fullHash = new HashChanger().getHash();
                    const urlParsing = await sap.ushell.Container.getServiceAsync("URLParsing");
                    const shellHash = urlParsing.parseShellHash(fullHash);
                    const sAction = shellHash.action;
                    csAction = shellHash.action;
                }

                var DisplayStateModel = new JSONModel();
                var DisplayData = {
                    sAction: csAction,
                    visible: csAction === "display" ? false : true
                }

                this.getView().getModel("ui").setProperty("/DisplayMode", csAction);

                DisplayStateModel.setData(DisplayData);
                this.getView().setModel(DisplayStateModel, "DisplayActionModel");

                // this.byId("btnAddHdr").setVisible(csAction === "display" ? false : true);
                // this.byId("btnEditHdr").setVisible(csAction === "display" ? false : true);
                // this.byId("btnDeleteHdr").setVisible(csAction === "display" ? false : true);
            },

            onSBUChange: async function (oEvent) {
                // alert("onSBUChange");
                this._sbuChange = true;

                var me = this;
                var vSBU = this.getView().byId("cboxSBU").getSelectedKey();

                // _promiseResult = new Promise((resolve, reject) => {
                //     oModel.read("/ZVB_3DERP_SHIPMODE_SH", {
                //         success: function (oData, oResponse) {
                //             console.log("SHIPMODE_MODEL", oData.results);
                //             me.getView().setModel(new JSONModel(oData.results), "SHIPMODE_MODEL");
                //         },
                //         error: function (err) { }
                //     });
                //     resolve();
                // });
                // await _promiseResult;
            },

            onSearch: async function () {
                // var vSBU = this.getView().byId("cboxSBU").getSelectedKey();
                // this.getView().getModel("ui").setProperty("/currsbu", vSBU);

                // console.log(this.getView().getModel("SIZESEQModel").getData());

                this.getView().getModel("ui").setProperty("/activeIONO", "");
                this.getView().getModel("ui").setProperty("/activeIONODisplay", "");

                this.getView().getModel("ui").setProperty("/activeDLVSEQ", "");
                this.getView().getModel("ui").setProperty("/activeDLVSEQDisplay", "");

                this.getView().getModel("ui").setProperty("/activeCUSTCOLOR", "");
                this.getView().getModel("ui").setProperty("/activeCUSTCOLORDisplay", "");

                if (this.getView().byId("cboxSBU") !== undefined) {
                    this._sbu = this.getView().byId("cboxSBU").getSelectedKey();
                    // console.log(this._sbu);
                } else {
                    //SBU as DropdownList
                    this._sbu = this.getView().byId("smartFilterBar").getFilterData().SBU;  //get selected SBU
                    // console.log(this._sbu);
                }

                this.getView().getModel("ui").setProperty("/sbu", this._sbu);
                
                await new Promise((resolve, reject) => {
                    // this.getColumnProp();
                    // this.getRptColumnProp();
                    this.getRptColumnProp();
                    resolve();
                });

                await new Promise((resolve, reject) => {
                    // this.getHeaderData();
                    this.getHeaderData(me._pvtColumnData, me._pvtPivotArray, "headerTab");
                    resolve();
                });

                // this.getDetailData(true);
            },

            getColumnProp: async function () {
                var sPath = jQuery.sap.getModulePath("zuiiodlvrpt", "/model/columns.json");

                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                this._oModelColumns = oModelColumns.getData();
                // var oColumns = [];

                //get dynamic columns based on saved layout or ZERP_CHECK
                setTimeout(() => {
                    this.getDynamicColumns("IODLVRPT", "ZDV_3D_IODLVRPT", "headerTab", oColumns);
                }, 100);

                // setTimeout(() => {
                //     this.getDynamicColumns("ASNDET", "ZERP_SCIASNDET", "detailTab", oColumns);
                // }, 100);
            },

            getDynamicColumns(arg1, arg2, arg3, arg4) {
                var me = this;
                var sType = arg1;
                var sTabName = arg2;
                var sTabId = arg3;
                var oLocColProp = arg4;
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                // var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZGW_3DERP_COMMON_SRV/");
                var vSBU = "VER";

                // console.log("getDynamicColumns", oModel);

                oModel.setHeaders({
                    sbu: vSBU,
                    type: sType,
                    tabname: sTabName
                });

                // console.log("1", oModel.getHeaders());
                oModel.read("/ColumnsSet", {

                    success: function (oData, oResponse) {
                        // console.log("2");
                        console.log(arg1, oData);
                        if (oData.results.length > 0) {
                            if (oLocColProp[sTabId.replace("Tab", "")] !== undefined) {
                                oData.results.forEach(item => {
                                    oLocColProp[sTabId.replace("Tab", "")].filter(loc => loc.ColumnName === item.ColumnName)
                                        .forEach(col => {
                                            item.ValueHelp = col.ValueHelp;
                                            item.TextFormatMode = col.TextFormatMode;
                                        })
                                })
                            }

                            me._aColumns[sTabId.replace("Tab", "")] = oData.results;
                            me.setTableColumns(sTabId, oData.results);

                            // var oDDTextResult = me.getView().getModel("ddtext").getData();
                            // oData.results.forEach(item => {
                            //     oDDTextResult[item.ColumnName] = item.ColumnLabel;
                            // })

                            // me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");                                                      
                        }
                    },
                    error: function (err) {
                        // console.log("3");
                        // console.log("err", err);
                    }
                });
            },

            getRptColumnProp: async function () {
                // alert("getRptColumnProp");
                var sPath = jQuery.sap.getModulePath("zuiiodlvrpt", "/model/columns.json");

                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                this._oModelColumns = oModelColumns.getData();
                // var oColumns = [];

                //get dynamic columns based on saved layout or ZERP_CHECK
                setTimeout(() => {
                    this.getRptDynamicColumns("IODLVRPT", "ZDV_3D_IODLVRPT", "headerTab", oColumns);
                }, 100);

                // setTimeout(() => {
                //     this.getDynamicColumns("ASNDET", "ZERP_SCIASNDET", "detailTab", oColumns);
                // }, 100);
            },

            getRptDynamicColumns: async function (arg1, arg2, arg3, arg4) {
                var me = this;
                var columnData = [];
                var sType = arg1;
                var sTabName = arg2;
                var sTabId = arg3;
                var oLocColProp = arg4;
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                var o3DModel = this.getOwnerComponent().getModel("ZGW_3DERP_SRV");
                // var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZGW_3DERP_COMMON_SRV/");
                var vSBU = this._sbu;
                var _promiseResult;

                // console.log("getDynamicColumns", oModel);

                var oJSONCommonDataModel = new sap.ui.model.json.JSONModel();
                var oJSON3DDataModel = new sap.ui.model.json.JSONModel();
                var oJSONModel = new sap.ui.model.json.JSONModel();

                this._columns;
                var columns;
                var ccolumns;
                var pivotArray;

                console.log("getRptDynamicColumns - SIZESEQModel", this.getView().getModel("SIZESEQModel"));

                pivotArray = me.getView().getModel("SIZESEQModel").getData().oData;

                me._pvtPivotArray = me.getView().getModel("SIZESEQModel").getData().oData;

                oModel.setHeaders({
                    sbu: vSBU,
                    type: sType,
                    tabname: sTabName
                });

                // console.log("1", oModel.getHeaders());
                _promiseResult = new Promise((resolve, reject) => {
                    oModel.read("/ColumnsSet", {

                        success: function (oData, oResponse) {
                            // console.log("2");
                            console.log(arg1, oData);
                            if (oData.results.length > 0) {

                                oJSONCommonDataModel.setData(oData);
                                me.getView().setModel(oJSONCommonDataModel, "IORPTModel");
                                resolve();
                            }
                        },
                        error: function (err) {
                            resolve();
                        }
                    });
                    
                });
                await _promiseResult;

                o3DModel.setHeaders({
                    sbu: vSBU,
                    type: sType
                    ,
                    usgcls: ""
                });

                //get dynamic columns of IO Details pivoted by Size
                _promiseResult = new Promise((resolve, reject) => {
                    // setTimeout(() => {
                    o3DModel.read("/DynamicColumnsSet", {
                        success: function (oData, oResponse) {
                            if (oData.results.length > 0) {
                                // console.log("Dynamic Columns Set");
                                // console.log(oData);
                                oJSON3DDataModel.setData(oData);
                                me.getView().setModel(oJSON3DDataModel, "IORPTPVTModel");

                                // this._columns = oData.results;
                            }
                            resolve();
                        },
                        error: function (err) {
                            // Common.closeLoadingDialog(that);
                            resolve();
                        }
                    });
                    // }, 100);
                });
                await _promiseResult;

                var pivotRow;

                columns = me.getView().getModel("IORPTPVTModel").getProperty("/results");
                ccolumns = me.getView().getModel("IORPTModel").getProperty("/results");

                console.log("columns", columns);
                console.log("ccolumns", ccolumns);

                //find the column to pivot  ATTRIBSEQ
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].Pivot !== '') {
                        console.log("columns[i].Pivot", columns[i].Pivot);
                        pivotRow = columns[i].Pivot;
                    }
                }

                console.log("pivotArray", pivotArray);
                for (var i = 0; i < columns.length; i++) {
                    // console.log("columns[i]", columns[i]);
                    if (columns[i].Pivot === pivotRow && columns[i].ColumnName === "ATTRIBSEQ") {
                        //pivot the columns
                        // console.log("REVORDERQTY");
                        // console.log("pivotArray", pivotArray);
                        for (var j = 0; j < pivotArray.length; j++) {
                            // console.log("pivotArray[j].ATTRIBTYP", pivotArray[j].ATTRIBTYP);
                            if (pivotArray[j].ATTRIBTYP === "SIZE") {
                                // console.log(ccolumns);
                                // console.log("pivotArray[j].ATTRIBSEQ", pivotArray[j].ATTRIBSEQ);
                                columnData.push({
                                    "ColumnName": pivotArray[j].ATTRIBSEQ + ccolumns[i].ColumnName,
                                    "ColumnLabel": "Size " + pivotArray[j].ATTRIBSEQ,
                                    "ColumnWidth": 120,
                                    "ColumnType": pivotRow,
                                    "DataType": ccolumns[i].DataType,
                                    "Editable": ccolumns[i].Editable,
                                    "Mandatory": columns[i].Mandatory,
                                    "Visible": true,
                                    "Creatable": ccolumns[i].Creatable,
                                    "Decimal": ccolumns[i].Decimal,
                                    "DictType": ccolumns[i].DictType,
                                    "Key": ccolumns[i].Key,
                                    "Length": ccolumns[i].Length,
                                    "Order": ccolumns[i].Length,
                                    "SortOrder": ccolumns[i].SortOrder,
                                    "SortSeq": ccolumns[i].SortSeq,
                                    "Sorted": ccolumns[i].Sorted
                                })

                                columnData.push({
                                    "ColumnName": pivotArray[j].ATTRIBSEQ + ccolumns[i + 1].ColumnName,
                                    "ColumnLabel": pivotArray[j].ATTRIBSEQ + " " + ccolumns[i + 1].ColumnLabel,
                                    "ColumnWidth": 120,
                                    "ColumnType": pivotRow,
                                    "DataType": ccolumns[i + 1].DataType,
                                    "Editable": ccolumns[i + 1].Editable,
                                    "Mandatory": columns[i + 1].Mandatory,
                                    "Visible": true,
                                    "Creatable": ccolumns[i + 1].Creatable,
                                    "Decimal": ccolumns[i + 1].Decimal,
                                    "DictType": ccolumns[i + 1].DictType,
                                    "Key": ccolumns[i + 1].Key,
                                    "Length": ccolumns[i + 1].Length,
                                    "Order": ccolumns[i + 1].Length,
                                    "SortOrder": ccolumns[i + 1].SortOrder,
                                    "SortSeq": ccolumns[i + 1].SortSeq,
                                    "Sorted": ccolumns[i + 1].Sorted
                                })

                                columnData.push({
                                    "ColumnName": pivotArray[j].ATTRIBSEQ + ccolumns[i + 2].ColumnName,
                                    "ColumnLabel": pivotArray[j].ATTRIBSEQ + " " + ccolumns[i + 2].ColumnLabel,
                                    "ColumnWidth": 120,
                                    "ColumnType": pivotRow,
                                    "DataType": ccolumns[i + 2].DataType,
                                    "Editable": ccolumns[i + 2].Editable,
                                    "Mandatory": columns[i + 2].Mandatory,
                                    "Visible": true,
                                    "Creatable": ccolumns[i + 2].Creatable,
                                    "Decimal": ccolumns[i + 2].Decimal,
                                    "DictType": ccolumns[i + 2].DictType,
                                    "Key": ccolumns[i + 2].Key,
                                    "Length": ccolumns[i + 2].Length,
                                    "Order": ccolumns[i + 2].Length,
                                    "SortOrder": ccolumns[i + 2].SortOrder,
                                    "SortSeq": ccolumns[i + 2].SortSeq,
                                    "Sorted": ccolumns[i + 2].Sorted
                                })

                                // columnData.push({
                                //     "ColumnName": "IOITEM" + pivotArray[j].ATTRIBSEQ + ccolumns[i].ColumnName,
                                //     "ColumnLabel": "IOITEM" + pivotArray[j].ATTRIBSEQ,
                                //     "ColumnWidth": 70,
                                //     "ColumnType": "",
                                //     "DataType": "NUMBER",
                                //     "Editable": false,
                                //     "Mandatory": "",
                                //     "Visible": false,
                                //     "Creatable": false,
                                //     "Decimal": 0,
                                //     "DictType": "",
                                //     "Key": "",
                                //     "Length": 0,
                                //     "Order": "",
                                //     "SortOrder": "",
                                //     "SortSeq": "",
                                //     "Sorted": false
                                // })
                            }
                        }
                    } else {
                        if (columns[i].ColumnName !== pivotRow 
                            // && columns[i].ColumnName !== "IOITEM" && columns[i].ColumnName !== "IONO" 
                        // && columns[i].ColumnName !== "SHIPQTY"
                            // && columns[i].ColumnName !== "SALDOCNO" && columns[i].ColumnName !== "SALDOCITEM"
                            // && columns[i].ColumnName !== "CREATEDBY" 
                            // && columns[i].ColumnName !== "CREATEDDT" && columns[i].ColumnName !== "CREATEDTM"
                            // && columns[i].ColumnName !== "UPDATEDBY" && columns[i].ColumnName !== "UPDATEDDT" && columns[i].ColumnName !== "UPDATEDTM"
                            ) {
                            if (columns[i].Visible === true && ccolumns[i] !== undefined) {
                                // console.log("ccolumns[i]");
                                // console.log(ccolumns[i]);
                                // console.log("CColumns loop");
                                // console.log(ccolumns);

                                // console.log(i, ccolumns[i]);
                                // console.log(i, ccolumns[i].ColumnName);
                                columnData.push({
                                    "ColumnName": ccolumns[i].ColumnName,
                                    "ColumnLabel": ccolumns[i].ColumnLabel,
                                    "ColumnWidth": ccolumns[i].ColumnWidth,
                                    "ColumnType": ccolumns[i].ColumnType,
                                    "DataType": ccolumns[i].DataType,
                                    "Editable": ccolumns[i].Editable,
                                    "Mandatory": ccolumns[i].Mandatory,
                                    "Visible": ccolumns[i].Visible,
                                    "Creatable": ccolumns[i].Creatable,
                                    "Decimal": ccolumns[i].Decimal,
                                    "DictType": ccolumns[i].DictType,
                                    "Key": ccolumns[i].Key,
                                    "Length": ccolumns[i].Length,
                                    "Order": ccolumns[i].Length,
                                    "SortOrder": ccolumns[i].SortOrder,
                                    "SortSeq": ccolumns[i].SortSeq,
                                    "Sorted": ccolumns[i].Sorted
                                })
                            }
                        }
                    }
                }

                if (oLocColProp[sTabId.replace("Tab", "")] !== undefined) {
                    columnData.forEach(item => {
                        oLocColProp[sTabId.replace("Tab", "")].filter(loc => loc.ColumnName === item.ColumnName)
                            .forEach(col => {
                                item.ValueHelp = col.ValueHelp;
                                item.TextFormatMode = col.TextFormatMode;
                            })
                    })
                }

                me._aIOColumns[sTabId.replace("Tab", "")] = columnData;
                me._aColumns[sTabId.replace("Tab", "")] = columnData;

                oJSONModel.setData(columnData);
                me.getView().setModel(oJSONModel, "columnData");

                oJSONModel.setData(pivotArray);
                me.getView().setModel(oJSONModel, "pivotArray");

                me._pvtColumnData = columnData;
                me._pvtPivotArray = pivotArray;

                console.log("columnData", columnData);
                console.log("pivotArray", pivotArray);
                console.log("sTabId", sTabId);

                me.setTableColumns(sTabId, columnData);

                // await new Promise((resolve, reject) => {
                //     me.getIODLVRPTableData(columnData, pivotArray, sTabId);
                //     resolve();
                // });
            },

            setTableColumns(arg1, arg2) {
                var sTabId = arg1;
                var oColumns = arg2;
                var oTable = this.getView().byId(sTabId);
                // console.log(oTable)
                oTable.getModel().setProperty("/columns", oColumns);

                // sap.ui.table.Table.prototype._scrollNext = function() {
                //     // we are at the end => scroll one down if possible
                //     if (this.getFirstVisibleRow() < this._getRowCount() - this.getVisibleRowCount()) {
                //         this.setFirstVisibleRow(Math.min(this.getFirstVisibleRow() + 1, this._getRowCount() - this.getVisibleRowCount()));
                //     }
                // };

                //bind the dynamic column to the table
                oTable.bindColumns("/columns", function (index, context) {
                    var sColumnId = context.getObject().ColumnName;
                    var sColumnLabel = context.getObject().ColumnLabel;
                    var sColumnWidth = context.getObject().ColumnWidth;
                    var sColumnVisible = context.getObject().Visible;
                    var sColumnSorted = context.getObject().Sorted;
                    var sColumnSortOrder = context.getObject().SortOrder;
                    var sColumnDataType = context.getObject().DataType;
                    var sTextWrapping = context.getObject().WrapText;

                    if (sColumnWidth === 0) sColumnWidth = 100;

                    var oText = new sap.m.Text({
                        wrapping: sTextWrapping === "X" ? true : false
                        // , tooltip: sColumnDataType === "BOOLEAN" || sColumnDataType === "NUMBER" ? "" : "{" + sColumnId + "}",
                        // width: (+sColumnWidth-15) + "px"
                    })

                    var oColProp = me._aColumns[sTabId.replace("Tab", "")].filter(fItem => fItem.ColumnName === sColumnId);

                    if (oColProp && oColProp.length > 0 && oColProp[0].ValueHelp && oColProp[0].ValueHelp["items"].text && oColProp[0].ValueHelp["items"].value !== oColProp[0].ValueHelp["items"].text &&
                        oColProp[0].TextFormatMode && oColProp[0].TextFormatMode !== "Key") {
                        oText.bindText({
                            parts: [
                                { path: sColumnId }
                            ],
                            formatter: function (sKey) {
                                // console.log(oColProp[0].ValueHelp["items"].path, me.getView().getModel(oColProp[0].ValueHelp["items"].path).getData());
                                console.log(oColProp[0].ValueHelp["items"].path);
                                var oValue = me.getView().getModel(oColProp[0].ValueHelp["items"].path).getData().filter(v => v[oColProp[0].ValueHelp["items"].value] === sKey);

                                // this.removeStyleClass("green");

                                // if (sKey === "COMM") {
                                //     this.addStyleClass("green");
                                // }

                                if (oValue && oValue.length > 0) {
                                    if (oColProp[0].TextFormatMode === "Value") {
                                        return oValue[0][oColProp[0].ValueHelp["items"].text];
                                    }
                                    else if (oColProp[0].TextFormatMode === "ValueKey") {
                                        return oValue[0][oColProp[0].ValueHelp["items"].text] + " (" + sKey + ")";
                                    }
                                    else if (oColProp[0].TextFormatMode === "KeyValue") {
                                        return sKey + " (" + oValue[0][oColProp[0].ValueHelp["items"].text] + ")";
                                    }
                                }
                                else return sKey;
                            }
                        });
                    }
                    else {
                        oText.bindText({
                            parts: [
                                { path: sColumnId }
                            ]
                        });
                    }

                    if (sColumnDataType === "STRING") {
                        return new sap.ui.table.Column({
                            id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                            label: new sap.m.Text({ text: sColumnLabel, wrapping: true }),  //sColumnLabel,
                            template: oText,
                            // template: new sap.m.Text({
                            //     text: "{" + sColumnId + "}",
                            //     wrapping: false
                            //     // , 
                            //     // tooltip: "{" + sColumnId + "}"
                            // }),
                            width: sColumnWidth + "px",
                            sortProperty: sColumnId,
                            filterProperty: sColumnId,
                            autoResizable: true,
                            visible: sColumnVisible,
                            sorted: sColumnSorted,
                            hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                            sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending")
                        });
                    } else if (sColumnDataType === "BOOLEAN") {
                        return new sap.ui.table.Column({
                            id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                            label: new sap.m.Text({ text: sColumnLabel, wrapping: true }),  //sColumnLabel
                            template: new sap.m.CheckBox({
                                selected: "{" + sColumnId + "}",
                                editable: false
                            }),
                            width: sColumnWidth + "px",
                            sortProperty: sColumnId,
                            filterProperty: sColumnId,
                            autoResizable: true,
                            visible: sColumnVisible,
                            sorted: sColumnSorted,
                            hAlign: "Center",
                            sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending")
                        });
                    } else {
                        return new sap.ui.table.Column({
                            id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                            label: new sap.m.Text({ text: sColumnLabel, wrapping: true }),  //sColumnLabel
                            template: oText,
                            width: sColumnWidth + "px",
                            sortProperty: sColumnId,
                            filterProperty: sColumnId,
                            autoResizable: true,
                            visible: sColumnVisible,
                            sorted: sColumnSorted,
                            hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                            sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending")
                        });
                    }

                    // return new sap.ui.table.Column({
                    //     id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                    //     name: sColumnId,
                    //     label: new sap.m.Text({ text: sColumnLabel }),
                    //     template: oText,
                    //     width: sColumnWidth + "px",
                    //     sortProperty: sColumnId,
                    //     // filterProperty: sColumnId,
                    //     autoResizable: true,
                    //     visible: sColumnVisible,
                    //     sorted: sColumnSorted,
                    //     hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                    //     sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending")
                    // });
                });

                //date/number sorting
                oTable.attachSort(function (oEvent) {
                    var sPath = oEvent.getParameter("column").getSortProperty();
                    var bMultiSort = oEvent.getParameter("columnAdded");
                    var bDescending, sSortOrder, oSorter, oColumn, columnType;
                    var aSorts = [];

                    if (!bMultiSort) {
                        oTable.getColumns().forEach(col => {
                            if (col.getSorted()) {
                                col.setSorted(false);
                            }
                        })
                    }

                    oTable.getSortedColumns().forEach(col => {
                        if (col.getProperty("name") === sPath) {
                            sSortOrder = oEvent.getParameter("sortOrder");
                            oEvent.getParameter("column").setSorted(true); //sort icon indicator
                            oEvent.getParameter("column").setSortOrder(sSortOrder); //set sort order                          
                        }
                        else {
                            sSortOrder = col.getProperty("sortOrder");
                        }

                        bDescending = (sSortOrder === "Descending" ? true : false);
                        oSorter = new sap.ui.model.Sorter(col.getProperty("name"), bDescending); //sorter(columnData, If Ascending(false) or Descending(True))
                        oColumn = oColumns.filter(fItem => fItem.ColumnName === col.getProperty("name"));
                        columnType = oColumn[0].DataType;

                        if (columnType === "DATETIME") {
                            oSorter.fnCompare = function (a, b) {
                                // parse to Date object
                                var aDate = new Date(a);
                                var bDate = new Date(b);

                                if (bDate === null) { return -1; }
                                if (aDate === null) { return 1; }
                                if (aDate < bDate) { return -1; }
                                if (aDate > bDate) { return 1; }

                                return 0;
                            };
                        }
                        else if (columnType === "NUMBER") {
                            oSorter.fnCompare = function (a, b) {
                                // parse to Date object
                                var aNumber = +a;
                                var bNumber = +b;

                                if (bNumber === null) { return -1; }
                                if (aNumber === null) { return 1; }
                                if (aNumber < bNumber) { return -1; }
                                if (aNumber > bNumber) { return 1; }

                                return 0;
                            };
                        }

                        aSorts.push(oSorter);
                    })

                    oTable.getBinding('rows').sort(aSorts);

                    // prevent internal sorting by table
                    oEvent.preventDefault();
                });

                // oTable.attachSort(function(oEvent) {
                //     var sPath = oEvent.getParameter("column").getSortProperty();
                //     var bDescending = false;

                //     oTable.getColumns().forEach(col => {
                //         if (col.getSorted()) {
                //             col.setSorted(false);
                //         }
                //     })

                //     oEvent.getParameter("column").setSorted(true); //sort icon initiator

                //     if (oEvent.getParameter("sortOrder") === "Descending") {
                //         bDescending = true;
                //         oEvent.getParameter("column").setSortOrder("Descending") //sort icon Descending
                //     }
                //     else {
                //         oEvent.getParameter("column").setSortOrder("Ascending") //sort icon Ascending
                //     }

                //     var oSorter = new sap.ui.model.Sorter(sPath, bDescending ); //sorter(columnData, If Ascending(false) or Descending(True))
                //     var oColumn = oColumns.filter(fItem => fItem.ColumnName === oEvent.getParameter("column").getProperty("sortProperty"));
                //     var columnType = oColumn[0].DataType;

                //     if (columnType === "DATETIME") {
                //         oSorter.fnCompare = function(a, b) {
                //             // parse to Date object
                //             var aDate = new Date(a);
                //             var bDate = new Date(b);

                //             if (bDate === null) { return -1; }
                //             if (aDate === null) { return 1; }
                //             if (aDate < bDate) { return -1; }
                //             if (aDate > bDate) { return 1; }

                //             return 0;
                //         };
                //     }
                //     else if (columnType === "NUMBER") {
                //         oSorter.fnCompare = function(a, b) {
                //             // parse to Date object
                //             var aNumber = +a;
                //             var bNumber = +b;

                //             if (bNumber === null) { return -1; }
                //             if (aNumber === null) { return 1; }
                //             if (aNumber < bNumber) { return -1; }
                //             if (aNumber > bNumber) { return 1; }

                //             return 0;
                //         };
                //     }

                //     oTable.getBinding('rows').sort(oSorter);
                //     // prevent internal sorting by table
                //     oEvent.preventDefault();
                // });

                TableFilter.updateColumnMenu(sTabId, this);

                var vWrap = oColumns[0].WrapText === "X" ? true : false;
                this.getView().getModel("ui").setProperty("/dataWrap/" + sTabId, vWrap);

                // oColumns.forEach(item => {
                //     var aFilterableColumns = [];
                //     aFilterableColumns.push({
                //         name: item.ColumnName
                //     });
                // })

                // var oSubMenu = new sap.ui.unified.Menu();
                // var oSubMenuItem = new sap.ui.unified.MenuItem({
                //     text: "test",
                //     select: function(oEvent) {
                //         alert(oEvent.getParameter("item").getText() + " Selected!");
                //     },
                //     icon: "sap-icon://filter"
                // });
                // oSubMenu.addItem(oSubMenuItem)

                // var oMenuItem = new sap.ui.unified.MenuItem({
                //     icon: "sap-icon://filter",
                //     text: "Filter",
                //     // select: "onQuantityCustomItemSelect"
                //     submenu: oSubMenu
                // })

                // oTable.getColumns().forEach(col => {
                //     console.log(col.getMenu())
                //     // Loop onto each column and attach Column Menu Open event
                //     col.attachColumnMenuOpen(function(oEvent) {
                //         //Get Menu associated with column
                //         var oMenu = col.getMenu();                        

                //         //Create the Menu Item that need to be added
                //         setTimeout(() => {
                //             console.log(oMenu)
                //             var wCustomFilter = false;
                //             oMenu.getItems().forEach(item => {
                //                 if (item.sId.indexOf("filter") >= 0) {
                //                     oMenu.removeItem(item);
                //                 }

                //                 if (item.mProperties.text !== undefined && item.mProperties.text === "Filter") {
                //                     wCustomFilter = true;
                //                 }
                //             })

                //             if (!wCustomFilter) {
                //                 oMenu.insertItem(oMenuItem, 2);                               
                //             }

                //             oMenu.setPageSize(oMenu.getItems().length); 
                //         }, 10);
                //     });
                // });
            },

            getHeaderData: async function (columnData, pivot, sTabId) {
                // // // Common.openProcessingDialog(me, "Processing...");

                var pColumnData = columnData;
                var pPivot = pivot;
                var pTabId = sTabId;

                // return;

                var rowData;
                var oTable;
                var oSmartFilter = this.getView().byId("smartFilterBar").getFilters();
                var aFilters = [], aFilter = [], aSmartFilter = [];

                // var vSBU = this.getView().getModel("ui").getProperty("/sbu");

                if (oSmartFilter.length > 0) {
                    oSmartFilter[0].aFilters.forEach(item => {
                        if (item.aFilters === undefined) {
                            console.log("aFilter", item);
                            if (item.sPath === "LIFNR" && item.oValue1.length === 7) {
                                aFilter.push(new Filter(item.sPath, item.sOperator, "000" + item.oValue1));
                            } else {
                                aFilter.push(new Filter(item.sPath, item.sOperator, item.oValue1));
                            }
                        }
                        else {
                            aFilters.push(item);
                        }
                    })

                    if (aFilter.length > 0) { aFilters.push(new Filter(aFilter, false)); }
                }

                if (Object.keys(this._oSmartFilterCustomControlProp).length > 0) {
                    Object.keys(this._oSmartFilterCustomControlProp).forEach(item => {
                        var oCtrl = this.getView().byId("smartFilterBar").determineControlByName(item);

                        if (oCtrl) {
                            var aCustomFilter = [];

                            if (oCtrl.getTokens().length === 1) {
                                oCtrl.getTokens().map(function (oToken) {
                                    console.log("aFilters", item);
                                    if (item === "LIFNR" && oToken.getKey().length === 7) {
                                        aFilters.push(new Filter(item, FilterOperator.EQ, "000" + oToken.getKey()))
                                    } else {
                                        aFilters.push(new Filter(item, FilterOperator.EQ, oToken.getKey()))
                                    }
                                })
                            }
                            else if (oCtrl.getTokens().length > 1) {
                                oCtrl.getTokens().map(function (oToken) {
                                    console.log("aCustomFilter", item);
                                    if (item === "LIFNR" && oToken.getKey().length === 7) {
                                        aCustomFilter.push(new Filter(item, FilterOperator.EQ, "000" + oToken.getKey()))
                                    } else {
                                        aCustomFilter.push(new Filter(item, FilterOperator.EQ, oToken.getKey()))
                                    }
                                })

                                aFilters.push(new Filter(aCustomFilter));
                            }
                        }
                    })
                }

                aFilters.push(new Filter("SBU", FilterOperator.EQ, this._sbu));
                aSmartFilter.push(new Filter(aFilters, true));

                // this.addDateFilters(aSmartFilter);
                console.log(aSmartFilter);
                // Common.closeProcessingDialog(me);
                // return;

                await new Promise((resolve, reject) => {
                    this._oModel.read('/IODLVRPTSet', {
                        filters: aSmartFilter,
                        success: function (oData) {
                            if (oData.results.length > 0) {
                                console.log("IODLVRPTSet", oData);
                                // oData.results.sort((a,b) => (a.SEQ > b.SEQ ? 1 : -1));

                                // oData.results.sort(function (a, b) {
                                //     return new Date(b.DLVSEQ) - new Date(a.DLVSEQ);
                                // });

                                console.log(oData.results);
                                var vIONO, vDLVSEQ, vCUSTCOLOR, vNewSeq = 1;
                                oData.results.forEach((item, index) => {
                                    if (index === 0) {
                                        vIONO = item.IONO;
                                        vDLVSEQ = item.DLVSEQ;
                                        vCUSTCOLOR = item.CUSTCOLOR;

                                        console.log("index 0", vIONO, vDLVSEQ, vCUSTCOLOR);
                                    }

                                    if (index !== 0) {
                                        console.log(index);
                                        console.log("reset", item.IONO, item.DLVSEQ, item.CUSTCOLOR, item.ATTRIBSEQ);
                                        if (vIONO !== item.IONO || vDLVSEQ !== item.DLVSEQ || vCUSTCOLOR !== item.CUSTCOLOR) {
                                            console.log("new");
                                            vIONO = item.IONO;
                                            vDLVSEQ = item.DLVSEQ;
                                            vCUSTCOLOR = item.CUSTCOLOR;
                                            vNewSeq = 1;
                                            item.ATTRIBSEQ = vNewSeq;
                                        } else {
                                            vNewSeq++;
                                            item.ATTRIBSEQ = vNewSeq;
                                        }
                                    }
                                    
                                    console.log("reset 2", item.IONO, item.DLVSEQ, item.CUSTCOLOR, item.ATTRIBSEQ);
                                    
                                    if (item.CREATEDDT !== null && item.CREATEDDT !== "  /  /" && item.CREATEDDT !== "") {
                                        item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                                    }
                                    if (item.DLVDT !== null && item.DLVDT !== "  /  /" && item.DLVDT !== "") {
                                        item.DLVDT = dateFormat.format(new Date(item.DLVDT));
                                    }
                                    if (item.DLVDT !== null && item.ETD !== "  /  /" && item.DLVDT !== "") {
                                        item.DLVDT = dateFormat.format(new Date(item.DLVDT));
                                    }

                                    if (index === 0) {
                                        item.ACTIVE = "X";
                                        me.getView().getModel("ui").setProperty("/activeIONO", item.IONO);
                                        me.getView().getModel("ui").setProperty("/activeIONODisplay", item.IONO);
                                    }
                                    else item.ACTIVE = "";
                                });

                                me.getView().setModel(new JSONModel(oData), "HEADER_MODEL");

                                // me.getDetailData(true);
                            }
                            // else {
                            //     me.byId("detailTab").getModel().setProperty("/rows", []);
                            //     me.byId("detailTab").bindRows("/rows");
                            //     me.getView().getModel("counts").setProperty("/detail", 0);
                            //     Common.closeProcessingDialog(me);
                            // }

                            // me.byId("headerTab").getModel().setProperty("/rows", oData.results);
                            // me.byId("headerTab").bindRows("/rows");
                            // me.getView().getModel("counts").setProperty("/header", oData.results.length);
                            // me.setActiveRowHighlight("headerTab");

                            // // if (me._aColFilters.length > 0) { me.setColumnFilters("headerTab"); }
                            // if (me._aColSorters.length > 0) { me.setColumnSorters("headerTab"); }
                            // TableFilter.applyColFilters("headerTab", me);

                            // // // Common.closeProcessingDialog(me);
                            resolve();
                        },
                        error: function (err) {
                            // // // Common.closeProcessingDialog(me);
                            resolve();
                        }
                    })
                });

                rowData = me.getView().getModel("HEADER_MODEL").getProperty("/results");
                console.log("rowData", rowData);

                var unique = rowData.filter((rowData, index, self) =>
                    index === self.findIndex((t) => (t.CUSTCOLOR === rowData.CUSTCOLOR && t.IONO === rowData.IONO && t.DLVSEQ === rowData.DLVSEQ)));
                 
                console.log("unique", unique);
                console.log("pivot", pivot);

                //For every unique item
                for (var i = 0; i < unique.length; i++) {

                    //Set the pivot column for each unique item
                    for (var j = 0; j < rowData.length; j++) {
                        if (rowData[j].ATTRIBSEQ !== "") {
                            // if (unique[i].DLVITEM === rowData[j].DLVITEM && unique[i].CUSTSIZE === rowData[j].CUSTSIZE) {
                            if (unique[i].CUSTCOLOR === rowData[j].CUSTCOLOR && unique[i].IONO === rowData[j].IONO && unique[i].DLVSEQ === rowData[j].DLVSEQ) {
                                for (var k = 0; k < pPivot.length; k++) {
                                    var colname = pPivot[k].ATTRIBSEQ;
                                    // console.log("colname");
                                    // console.log(colname + " " + rowData[j].ATTRIBSEQ);
                                    // console.log("Cust Size");
                                    // console.log(rowData[j].CUSTSIZE);
                                    if (+rowData[j].ATTRIBSEQ === colname) {
                                            unique[i][colname + "ATTRIBSEQ"] = rowData[j].CUSTSIZE;
                                            unique[i][colname + "REVORDERQTY"] = rowData[j].REVORDERQTY;
                                            unique[i][colname + "SZESHIPQTY"] = rowData[j].SZESHIPQTY;
                                            // unique[i]["IOITEM" + colname + "SZSHIPQTY"] = rowData[j].IOITEM;                               
                                    }
                                }
                            }
                        }
                    }
                }

                unique.forEach((item, index) => item.ACTIVE = index === 0 ? "X" : "");

                var oJSONModel = new JSONModel();
                oJSONModel.setData({
                    results: unique,
                    columns: pColumnData
                });

                console.log("oJSONModel.setData", unique, pColumnData);

                oTable = this.getView().byId(pTabId);
                oTable.setModel(oJSONModel, "DataModel");

                // this.byId(sTabId).getModel().setProperty("DataModel>/results", unique);
                //     this.byId(sTabId).bindRows("DataModel>/results");
                //     this._tableRendered = sTabId;

                this.byId(pTabId).getModel().setProperty("/results", unique);
                this.byId(pTabId).bindRows("/results");
                this.getView().getModel("counts").setProperty("/header", unique.length);
                this.setActiveRowHighlight(pTabId);
                this._tableRendered = pTabId;
                // if (me._aColFilters.length > 0) { me.setColumnFilters("headerTab"); }
                if (this._aColSorters.length > 0) { this.setColumnSorters(pTabId); }
                TableFilter.applyColFilters(pTabId, this);
            },

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    if (this.byId(oEvent.srcControl.sId).getBindingContext()) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext().sPath;

                        oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                        oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }

                    // if (oTable.getId().indexOf("headerTab") >= 0) {
                    //     var oTableDetail = this.byId("detailTab");
                    //     var oColumns = oTableDetail.getColumns();

                    //     for (var i = 0, l = oColumns.length; i < l; i++) {
                    //         if (oColumns[i].getSorted()) {
                    //             oColumns[i].setSorted(false);
                    //         }
                    //     }
                    // }
                }
                // else if (oEvent.key === "Enter" && oEvent.srcControl.sParentAggregationName === "cells") {
                //     if (this._dataMode === "NEW") this.onAddNewRow();
                // }               
            },

            onAfterTableRendering: function (oEvent) {
                if (this._tableRendered !== "") {
                    this.setActiveRowHighlightByTableId(this._tableRendered);
                    this._tableRendered = "";
                }
            },

            setActiveRowHighlightByTable(arg) {
                var oTable = arg;

                setTimeout(() => {
                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow");
                    })
                }, 1);
            },

            setActiveRowHighlightByTableId(arg) {
                var oTable = this.byId(arg);

                setTimeout(() => {
                    var iActiveRowIndex = oTable.getModel().getData().rows.findIndex(item => item.ACTIVE === "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow");
                    })
                }, 10);
            },

            onCellClick: function (oEvent) {
                if (oEvent.getParameters().rowBindingContext) {
                    var oTable = oEvent.getSource(); //this.byId("ioMatListTab");
                    var sRowPath = oEvent.getParameters().rowBindingContext.sPath;

                    if (oTable.getId().indexOf("headerTab") >= 0) {
                        var vCurrIONO = oTable.getModel().getProperty(sRowPath + "/IONO");
                        var vPrevIONO = this.getView().getModel("ui").getData().activeIONO;

                        var vCurrDLVSEQ = oTable.getModel().getProperty(sRowPath + "/DLVSEQ");
                        var vPrevDLVSEQ = this.getView().getModel("ui").getData().activeDLVSEQ;

                        var vCurrCUSTCOLOR = oTable.getModel().getProperty(sRowPath + "/CUSTCOLOR");
                        var vPrevCUSTCOLOR = this.getView().getModel("ui").getData().activeCUSTCOLOR;

                        // console.log(vCurrASN);
                        // console.log(vPrevASN);

                        // console.log(vCurrASNDT);
                        // console.log(vPrevASNDT);

                        if (vCurrIONO !== vPrevIONO && vCurrDLVSEQ !== vPrevDLVSEQ && vCurrCUSTCOLOR !== vPrevCUSTCOLOR) {
                            this.getView().getModel("ui").setProperty("/activeIONO", vCurrIONO);
                            this.getView().getModel("ui").setProperty("/activeDLVSEQ", vCurrDLVSEQ);
                            this.getView().getModel("ui").setProperty("/activeCUSTCOLOR", vCurrCUSTCOLOR);

                            if (this._dataMode === "READ") {
                                this.getView().getModel("ui").setProperty("/activeIONODisplay", vCurrIONO);
                                this.getView().getModel("ui").setProperty("/activeDLVSEQDisplay", vCurrDLVSEQ);
                                this.getView().getModel("ui").setProperty("/activeCUSTCOLORDisplay", vCurrCUSTCOLOR);
                                // this.getDetailData(true);
                            }

                            // var oTableDetail = this.byId("detailTab");
                            // var oColumns = oTableDetail.getColumns();

                            // for (var i = 0, l = oColumns.length; i < l; i++) {
                            //     if (oColumns[i].getSorted()) {
                            //         oColumns[i].setSorted(false);
                            //     }
                            // }
                        }

                        if (this._dataMode === "READ") this._sActiveTable = "headerTab";
                    }
                    // else {
                    //     if (this._dataMode === "READ") this._sActiveTable = "detailTab";
                    // }

                    oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                    oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow")
                    })
                }
            },

            onTableClick(oEvent) {
                var oControl = oEvent.srcControl;
                var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

                while (sTabId.substr(sTabId.length - 3) !== "Tab") {
                    oControl = oControl.oParent;
                    sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];
                }

                if (this._dataMode === "READ") this._sActiveTable = sTabId;
                // console.log(this._sActiveTable);
            },

            filterGlobally: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                var sQuery = oEvent.getParameter("query");

                if (sTabId === "headerTab") {
                    this.byId("searchFieldDtl").setProperty("value", "");
                }

                if (this._dataMode === "READ") this._sActiveTable = sTabId;
                this.exeGlobalSearch(sQuery, this._sActiveTable);
            },

            exeGlobalSearch(arg1, arg2) {
                var oFilter = null;
                var aFilter = [];

                if (arg1) {
                    this._aColumns[arg2.replace("Tab", "")].forEach(item => {
                        if (item.DataType === "BOOLEAN") aFilter.push(new Filter(item.ColumnName, FilterOperator.EQ, arg1));
                        else aFilter.push(new Filter(item.ColumnName, FilterOperator.Contains, arg1));
                    })

                    oFilter = new Filter(aFilter, false);
                }

                this.byId(arg2).getBinding("rows").filter(oFilter, "Application");

                if (arg1 && arg2 === "headerTab") {
                    var vIONO = this.byId(arg2).getModel().getData().rows.filter((item, index) => index === this.byId(arg2).getBinding("rows").aIndices[0])[0].IONO;
                    var vDLVSEQ = this.byId(arg2).getModel().getData().rows.filter((item, index) => index === this.byId(arg2).getBinding("rows").aIndices[0])[0].DLVSEQ;
                    var vCUSTCOLOR = this.byId(arg2).getModel().getData().rows.filter((item, index) => index === this.byId(arg2).getBinding("rows").aIndices[0])[0].CUSTCOLOR;
                    this.getView().getModel("ui").setProperty("/activeIONO", vIONO);
                    this.getView().getModel("ui").setProperty("/activeIONODisplay", vIONO);

                    this.getView().getModel("ui").setProperty("/activeDLVSEQ", vDLVSEQ);
                    this.getView().getModel("ui").setProperty("/activeDLVSEQDisplay", vDLVSEQ);

                    this.getView().getModel("ui").setProperty("/activeCUSTCOLOR", vCUSTCOLOR);
                    this.getView().getModel("ui").setProperty("/activeCUSTCOLORDisplay", vCUSTCOLOR);

                    // this.getDetailData(true);
                }
            },

            formatValueHelp: function (sValue, sPath, sKey, sText, sFormat) {
                // console.log(sValue, sPath, sKey, sText, sFormat);
                var oValue = this.getView().getModel(sPath).getData().filter(v => v[sKey] === sValue);

                if (oValue && oValue.length > 0) {
                    if (sFormat === "Value") {
                        return oValue[0][sText];
                    }
                    else if (sFormat === "ValueKey") {
                        return oValue[0][sText] + " (" + sValue + ")";
                    }
                    else if (sFormat === "KeyValue") {
                        return sValue + " (" + oValue[0][sText] + ")";
                    }
                }
                else return sValue;
            },

            setColumnFilters(sTable) {
                if (me._aColFilters) {
                    var oTable = this.byId(sTable);
                    var oColumns = oTable.getColumns();

                    me._aColFilters.forEach(item => {
                        oColumns.filter(fItem => fItem.getFilterProperty() === item.sPath)
                            .forEach(col => {
                                col.filter(item.oValue1);
                            })
                    })
                }
            },

            setColumnSorters(sTable) {
                if (me._aColSorters) {
                    var oTable = this.byId(sTable);
                    var oColumns = oTable.getColumns();

                    me._aColSorters.forEach(item => {
                        oColumns.filter(fItem => fItem.getSortProperty() === item.sPath)
                            .forEach(col => {
                                col.sort(item.bDescending);
                            })
                    })
                }
            },

            onValueHelpRequested: function (oEvent) {
                var aCols = {
                    "cols": [
                        {
                            "label": "Code",
                            "template": "VHTitle",
                            "width": "5rem"
                        },
                        {
                            "label": "Description",
                            "template": "VHDesc"
                        }
                    ]
                }

                var oSource = oEvent.getSource();
                var sModel = this._sActiveTable.replace("Tab", "");

                this._inputSource = oSource;
                this._inputId = oSource.getId();
                this._inputValue = oSource.getValue();
                this._inputKey = oSource.getValue();
                this._inputField = oSource.getBindingInfo("value").parts[0].path;

                var vColProp = this._aColumns[sModel].filter(item => item.ColumnName === this._inputField);
                var vItemValue = vColProp[0].ValueHelp.items.value;
                var vItemDesc = vColProp[0].ValueHelp.items.text;
                var sPath = vColProp[0].ValueHelp.items.path;
                var vh = this.getView().getModel(sPath).getData();
                var sTextFormatMode = vColProp[0].TextFormatMode === "" ? "Key" : vColProp[0].TextFormatMode;

                vh.forEach(item => {
                    item.VHTitle = item[vItemValue];
                    item.VHDesc = vItemValue === vItemDesc ? "" : item[vItemDesc];

                    if (sTextFormatMode === "Key") {
                        item.VHSelected = this._inputValue === item[vItemValue];
                    }
                    else if (sTextFormatMode === "Value") {
                        item.VHSelected = this._inputValue === item[vItemDesc];
                    }
                    else if (sTextFormatMode === "KeyValue") {
                        item.VHSelected = this._inputValue === (item[vItemValue] + " (" + item[vItemDesc] + ")");
                    }
                    else if (sTextFormatMode === "ValueKey") {
                        item.VHSelected = this._inputValue === (item[vItemDesc] + " (" + item[vItemValue] + ")");
                    }

                    if (item.VHSelected) { this._inputKey = item[vItemValue]; }
                })
                // console.log(this._inputKey)
                vh.sort((a, b) => (a.VHTitle > b.VHTitle ? 1 : -1));

                var oVHModel = new JSONModel({
                    items: vh
                });

                this._oTableValueHelpDialog = sap.ui.xmlfragment("zuiiodlvrpt.view.fragments.valuehelp.TableValueHelpDialog", this);
                this.getView().addDependent(this._oTableValueHelpDialog);
                this._oTableValueHelpDialog.setModel(new JSONModel({
                    title: vColProp[0].ColumnLabel,
                }));

                this._oTableValueHelpDialog.getTableAsync().then(function (oTable) {
                    // console.log(oTable.isA(("sap.ui.table.Table")))
                    oTable.setModel(oVHModel);
                    // oTable.setRowHeight(70)

                    if (oTable.bindRows) {
                        oTable.getModel().setProperty("/columns", aCols.cols);

                        //bind the dynamic column to the table
                        oTable.bindColumns("/columns", function (index, context) {
                            // var sColumnId = context.getObject().ColumnName;
                            var sColumnLabel = context.getObject().label;
                            var sColumnWidth = context.getObject().ColumnWidth;
                            // var sColumnVisible = context.getObject().Visible;
                            // var sColumnSorted = context.getObject().Sorted;
                            // var sColumnSortOrder = context.getObject().SortOrder;
                            // var sColumnDataType = context.getObject().DataType;

                            if (sColumnWidth === 0) sColumnWidth = 100;

                            var oCtrl = new sap.m.Text({
                                text: "{" + context.getObject().template + "}",
                                wrapping: false
                            })

                            return new sap.ui.table.Column({
                                // id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                                label: new sap.m.Text({ text: sColumnLabel }),
                                template: oCtrl,
                                autoResizable: true,
                                width: sColumnWidth
                            });
                        });

                        oTable.bindAggregation("rows", "/items");
                    }

                    this._oTableValueHelpDialog.update();
                }.bind(this));

                var oToken = new Token();
                oToken.setKey(this._inputSource.getSelectedKey());
                oToken.setText(this._inputSource.getValue());
                this._oTableValueHelpDialog.setTokens([oToken]);
                this._oTableValueHelpDialog.open();
            },

            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");

                if (aTokens.length > 0) {
                    this._inputSource.setSelectedKey(aTokens[0].getKey());
                }
                this._oTableValueHelpDialog.close();
            },

            onValueHelpCancelPress: function () {
                this._oTableValueHelpDialog.close();
            },

            onValueHelpAfterClose: function () {
                this._oTableValueHelpDialog.destroy();
            },

            onFirstVisibleRowChanged: function (oEvent) {
                var oTable = oEvent.getSource();
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;

                setTimeout(() => {
                    var oData = oTable.getModel().getData().rows;
                    var iStartIndex = oTable.getBinding("rows").iLastStartIndex;
                    var iLength = oTable.getBinding("rows").iLastLength + iStartIndex;

                    if (oTable.getBinding("rows").aIndices.length > 0) {
                        for (var i = iStartIndex; i < iLength; i++) {
                            var iDataIndex = oTable.getBinding("rows").aIndices.filter((fItem, fIndex) => fIndex === i);

                            if (oData[iDataIndex].ACTIVE === "X") oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].addStyleClass("activeRow");
                            else oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].removeStyleClass("activeRow");
                        }
                    }
                    else {
                        for (var i = iStartIndex; i < iLength; i++) {
                            if (oData[i].ACTIVE === "X") oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].addStyleClass("activeRow");
                            else oTable.getRows()[iStartIndex === 0 ? i : i - iStartIndex].removeStyleClass("activeRow");
                        }
                    }
                }, 1);
            },

            onColumnUpdated: function (oEvent) {
                var oTable = oEvent.getSource();
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;

                this.setActiveRowHighlight();
            },

            onSort: function (oEvent) {
                var oTable = oEvent.getSource();
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;

                this.setActiveRowHighlight();
            },

            onFilter: function (oEvent) {
                var oTable = oEvent.getSource();
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;

                this.setActiveRowHighlight();

                setTimeout(() => {
                    if (this._sActiveTable === "headerTab") {
                        this.getView().getModel("counts").setProperty("/header", this.byId(this._sActiveTable).getBinding("rows").aIndices.length);
                    }
                    else if (this._sActiveTable === "detailTab") {
                        this.getView().getModel("counts").setProperty("/detail", this.byId(this._sActiveTable).getBinding("rows").aIndices.length);
                    }
                }, 100);
            },

            setActiveRowHighlight(sTableId) {
                var oTable = this.byId(sTableId !== undefined && sTableId !== "" ? sTableId : this._sActiveTable);

                setTimeout(() => {
                    var iActiveRowIndex = oTable.getModel().getData().rows.findIndex(item => item.ACTIVE === "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow");
                    })
                }, 100);
            },

            onInputKeyDown(oEvent) {
                if (oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") {
                    //prevent increase/decrease of number value
                    oEvent.preventDefault();

                    var sTableId = oEvent.srcControl.oParent.oParent.sId;
                    var oTable = this.byId(sTableId);
                    var sColumnName = oEvent.srcControl.getBindingInfo("value").parts[0].path;
                    var sCurrentRowIndex = +oEvent.srcControl.oParent.getBindingContext().sPath.replace("/rows/", "");
                    var sColumnIndex = -1;
                    var sCurrentRow = -1;
                    var sNextRow = -1;
                    var sActiveRow = -1;
                    var iFirstVisibleRowIndex = oTable.getFirstVisibleRow();
                    var iVisibleRowCount = oTable.getVisibleRowCount();

                    oTable.getModel().setProperty(oEvent.srcControl.oParent.getBindingContext().sPath + "/" + oEvent.srcControl.getBindingInfo("value").parts[0].path, oEvent.srcControl.getValue());

                    //get active row (arrow down)
                    oTable.getBinding("rows").aIndices.forEach((item, index) => {
                        if (item === sCurrentRowIndex) { sCurrentRow = index; }
                        if (sCurrentRow !== -1 && sActiveRow === -1) {
                            if ((sCurrentRow + 1) === index) { sActiveRow = item }
                            else if ((index + 1) === oTable.getBinding("rows").aIndices.length) { sActiveRow = item }
                        }
                    })

                    //clear active row
                    oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");

                    //get next row to focus and active row (arrow up)
                    if (oEvent.key === "ArrowUp") {
                        if (sCurrentRow !== 0) {
                            sActiveRow = oTable.getBinding("rows").aIndices.filter((fItem, fIndex) => fIndex === (sCurrentRow - 1))[0];
                        }
                        else { sActiveRow = oTable.getBinding("rows").aIndices[0] }

                        sCurrentRow = sCurrentRow === 0 ? sCurrentRow : sCurrentRow - iFirstVisibleRowIndex;
                        sNextRow = sCurrentRow === 0 ? 0 : sCurrentRow - 1;
                    }
                    else if (oEvent.key === "ArrowDown") {
                        sCurrentRow = sCurrentRow - iFirstVisibleRowIndex;
                        sNextRow = sCurrentRow + 1;
                    }

                    //set active row
                    oTable.getModel().setProperty("/rows/" + sActiveRow + "/ACTIVE", "X");

                    //auto-scroll up/down
                    if (oEvent.key === "ArrowDown" && (sNextRow + 1) < oTable.getModel().getData().rows.length && (sNextRow + 1) > iVisibleRowCount) {
                        oTable.setFirstVisibleRow(iFirstVisibleRowIndex + 1);
                    }
                    else if (oEvent.key === "ArrowUp" && sCurrentRow === 0 && sNextRow === 0 && iFirstVisibleRowIndex !== 0) {
                        oTable.setFirstVisibleRow(iFirstVisibleRowIndex - 1);
                    }

                    //get the cell to focus
                    oTable.getRows()[sCurrentRow].getCells().forEach((cell, index) => {
                        if (cell.getBindingInfo("value") !== undefined) {
                            if (cell.getBindingInfo("value").parts[0].path === sColumnName) { sColumnIndex = index; }
                        }
                    })

                    if (oEvent.key === "ArrowDown") {
                        sNextRow = sNextRow === iVisibleRowCount ? sNextRow - 1 : sNextRow;
                    }

                    //set focus on cell
                    setTimeout(() => {
                        oTable.getRows()[sNextRow].getCells()[sColumnIndex].focus();
                        oTable.getRows()[sNextRow].getCells()[sColumnIndex].getFocusDomRef().select();
                    }, 100);

                    //set row highlight
                    this.setActiveRowHighlight();
                }
            },

            onKeyDown(oEvent) {
                console.log(oEvent);
            },

            onTableResize: function (oEvent) {
                var oSplitter = this.byId("splitterMain");
                var oHeaderPane = oSplitter.getRootPaneContainer().getPanes().at(0);
                var oDetailPane = oSplitter.getRootPaneContainer().getPanes().at(1);
                var vFullScreen = oEvent.getSource().data("Fullscreen") === "1" ? true : false;
                var vPart = oEvent.getSource().data("Part");
                var vHeaderSize = oEvent.getSource().data("HeaderSize");
                var vDetailSize = oEvent.getSource().data("DetailSize");

                this._sActiveTable = oEvent.getSource().data("TableId");
                this.getView().getModel("ui").setProperty("/fullscreen/" + vPart, vFullScreen);
                this.byId("smartFilterBar").setVisible(!vFullScreen);

                var oHeaderLayoutData = new sap.ui.layout.SplitterLayoutData({
                    size: vHeaderSize,
                    resizable: false
                });

                var oDetailLayoutData = new sap.ui.layout.SplitterLayoutData({
                    size: vDetailSize,
                    resizable: false
                });

                oHeaderPane.setLayoutData(oHeaderLayoutData);
                oDetailPane.setLayoutData(oDetailLayoutData);
            },

            onWrapText: function (oEvent) {
                this._sActiveTable = oEvent.getSource().data("TableId");
                var vWrap = this.getView().getModel("ui").getData().dataWrap[this._sActiveTable];

                this.byId(this._sActiveTable).getColumns().forEach(col => {
                    var oTemplate = col.getTemplate();
                    oTemplate.setWrapping(!vWrap);
                    col.setTemplate(oTemplate);
                })

                this.getView().getModel("ui").setProperty("/dataWrap/" + [this._sActiveTable], !vWrap);
            },

            suggestionRowValidator: function (oColumnListItem) {
                var aCells = oColumnListItem.getCells();

                if (aCells.length === 1) {
                    return new sap.ui.core.Item({
                        key: aCells[0].getText(),
                        text: aCells[0].getText()
                    });
                }
                else {
                    return new sap.ui.core.Item({
                        key: aCells[0].getText(),
                        text: aCells[1].getText()
                    });
                }
            },

            onSaveTableLayout: function (oEvent) {
                //saving of the layout of table
                this._sActiveTable = oEvent.getSource().data("TableId");
                var oTable = this.byId(this._sActiveTable);
                var oColumns = oTable.getColumns();
                var vSBU = "VER"; //this.getView().getModel("ui").getData().sbu;
                var me = this;
                var ctr = 1;

                var oParam = {
                    "SBU": vSBU,
                    "TYPE": this._oTableLayout[this._sActiveTable].type,
                    "TABNAME": this._oTableLayout[this._sActiveTable].tabname,
                    "TableLayoutToItems": []
                };

                //get information of columns, add to payload
                oColumns.forEach((column) => {
                    oParam.TableLayoutToItems.push({
                        // COLUMNNAME: column.sId,
                        COLUMNNAME: column.mProperties.sortProperty,
                        ORDER: ctr.toString(),
                        SORTED: column.mProperties.sorted,
                        SORTORDER: column.mProperties.sortOrder,
                        SORTSEQ: "1",
                        VISIBLE: column.mProperties.visible,
                        WIDTH: column.mProperties.width.replace('px', ''),
                        WRAPTEXT: this.getView().getModel("ui").getData().dataWrap[this._sActiveTable] === true ? "X" : ""
                    });

                    ctr++;
                });

                console.log(oParam)

                //call the layout save
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                oModel.create("/TableLayoutSet", oParam, {
                    method: "POST",
                    success: function (data, oResponse) {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_LAYOUT_SAVE"]);
                    },
                    error: function (err) {
                        MessageBox.error(err);
                    }
                });
            },

            //******************************************* */
            // Column Filtering
            //******************************************* */

            onColFilterClear: function (oEvent) {
                TableFilter.onColFilterClear(oEvent, this);
            },

            onColFilterCancel: function (oEvent) {
                TableFilter.onColFilterCancel(oEvent, this);
            },

            onColFilterConfirm: function (oEvent) {
                TableFilter.onColFilterConfirm(oEvent, this);
            },

            onFilterItemPress: function (oEvent) {
                TableFilter.onFilterItemPress(oEvent, this);
            },

            onFilterValuesSelectionChange: function (oEvent) {
                TableFilter.onFilterValuesSelectionChange(oEvent, this);
            },

            onSearchFilterValue: function (oEvent) {
                TableFilter.onSearchFilterValue(oEvent, this);
            },

            onCustomColFilterChange: function (oEvent) {
                TableFilter.onCustomColFilterChange(oEvent, this);
            },

            onSetUseColFilter: function (oEvent) {
                TableFilter.onSetUseColFilter(oEvent, this);
            },

            onRemoveColFilter: function (oEvent) {
                TableFilter.onRemoveColFilter(oEvent, this);
            },

            //******************************************* */
            // Smart Filter
            //******************************************* */

            setSmartFilterModel: function () {
                var oModel = this.getOwnerComponent().getModel("ZVB_3D_IODLVRPT_FILTER_CDS");
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },

            beforeVariantFetch: function (oEvent) {
                SmartFilterCustomControl.beforeVariantFetch(this);
            },

            afterVariantLoad: function (oEvent) {
                SmartFilterCustomControl.afterVariantLoad(this);
            },

            clearSmartFilters: function (oEvent) {
                SmartFilterCustomControl.clearSmartFilters(this);
            },

            //******************************************* */
            // Functions
            //******************************************* */

            formatTimeOffSet(pTime) {
                let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                return timeFormat.format(new Date(pTime + TZOffsetMs));
            },

            //export to spreadsheet utility
            onExport: Utils.onExport
        });
    });
